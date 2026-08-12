import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../../context/AuthContext";
import { DOCTOR_ASSISTANT_ACTIONS, matchAssistantAction, matchCapabilityTheme } from "./doctorAssistantActions";
import { detectConversationLanguage } from "../../patient/assistant/patientAssistantLanguage";
import { createDoctorMockHistoryConversations } from "./doctorAssistantMockHistory";
import { loadDoctorAssistantState, saveDoctorAssistantState } from "./doctorAssistantStorage";
import { getDoctorClinicalBrief } from "./doctorClinicalInsights";

/**
 * THE Doctor Assistant conversation engine — extracted from what used to
 * be entirely local state inside DoctorHomeAssistant.jsx (that component's
 * own rendered markup/behavior is unchanged; only where its state LIVES
 * moved). This is the one piece of shared architecture the new Assistant
 * Drawer needs (shell task, Section 10's own "do not build a second
 * assistant engine"): mounted ONCE by DoctorDashboardShell.jsx, so both
 * the full Doctor Home workspace (DoctorHomeAssistant.jsx) and the quick
 * Topbar drawer (DoctorAssistantDrawer.jsx) read/write the exact same
 * `conversations` array — sending a message from either surface is
 * immediately visible from the other, with zero duplicated matching/
 * storage/insight logic.
 *
 * Doctor pages are NOT nested under a persistent React Router layout route
 * (unlike Patient's PatientLayout+Outlet) — each Doctor page renders its
 * own <DoctorLayout> independently (see routes/DashboardRoutes.jsx), so
 * navigating between Doctor pages unmounts and remounts this provider.
 * That's fine: the localStorage round-trip (loadDoctorAssistantState on
 * mount, saveDoctorAssistantState on every change) already means a
 * conversation started in the Drawer on one page and continued via "Open
 * full assistant" survives that remount — the effect below has always
 * flushed to storage by the time a later click triggers navigation, since
 * those are two separate user interactions, never the same commit. This
 * is why no cross-page routing changes were needed here at all.
 */

const SUCCESS_PULSE_MS = 700;

let conversationCounter = 0;
const nextConversationId = () => {
  conversationCounter += 1;
  return `doctor-live-${conversationCounter}`;
};

const createDraftConversation = () => {
  const now = new Date().toISOString();
  return { id: nextConversationId(), title: null, createdAt: now, updatedAt: now, language: null, status: "active", isMockHistory: false, messages: [] };
};

const buildInitialConversations = () => {
  const mockHistory = createDoctorMockHistoryConversations();
  const stored = loadDoctorAssistantState();
  if (stored && stored.conversations.length > 0) {
    return { conversations: [...mockHistory, ...stored.conversations], activeConversationId: stored.activeConversationId };
  }
  const draft = createDraftConversation();
  return { conversations: [...mockHistory, draft], activeConversationId: draft.id };
};

const DoctorAssistantContext = createContext(null);

export const DoctorAssistantProvider = ({ children }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const initialStateRef = useRef(null);
  if (initialStateRef.current === null) {
    initialStateRef.current = buildInitialConversations();
  }
  const [conversations, setConversations] = useState(() => initialStateRef.current.conversations);
  const [activeConversationId, setActiveConversationId] = useState(() => {
    const { conversations: seeded, activeConversationId: storedId } = initialStateRef.current;
    return seeded.some((conversation) => conversation.id === storedId) ? storedId : seeded[seeded.length - 1].id;
  });
  const [orbState, setOrbState] = useState("idle");
  const [lastActionId, setLastActionId] = useState(null);

  const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId);
  const messages = useMemo(() => activeConversation?.messages ?? [], [activeConversation]);
  const mode = messages.length === 0 ? "welcome" : "conversation";

  const idRef = useRef(0);
  const nextId = () => {
    idRef.current += 1;
    return idRef.current;
  };
  const successTimeoutRef = useRef(null);

  useEffect(() => () => {
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
  }, []);

  // Persist only non-mock, non-empty conversations — an empty just-created
  // draft is render-only state, never written (doctorAssistantStorage.js).
  useEffect(() => {
    const persistable = conversations.filter((conversation) => !conversation.isMockHistory && conversation.messages.length > 0);
    saveDoctorAssistantState({ conversations: persistable, activeConversationId });
  }, [conversations, activeConversationId]);

  const displayName = user?.first_name?.trim() || t("doctorDashboard.greeting.fallbackName");

  const greetingKey = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 18) return "afternoon";
    return "evening";
  }, []);

  const brief = useMemo(() => getDoctorClinicalBrief(), []);

  // Most-recently-asked suggestion moves to the end rather than staying
  // most prominent — same deterministic reorder patientHomeAssistant's own
  // suggestion rail already uses, not a recommendation engine.
  const suggestionActions = useMemo(() => {
    if (!lastActionId) return DOCTOR_ASSISTANT_ACTIONS;
    const rest = DOCTOR_ASSISTANT_ACTIONS.filter((action) => action.id !== lastActionId);
    const justAsked = DOCTOR_ASSISTANT_ACTIONS.find((action) => action.id === lastActionId);
    return justAsked ? [...rest, justAsked] : DOCTOR_ASSISTANT_ACTIONS;
  }, [lastActionId]);

  const pulseSuccess = () => {
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    setOrbState("success");
    successTimeoutRef.current = setTimeout(() => setOrbState("idle"), SUCCESS_PULSE_MS);
  };

  const updateConversation = (id, updater) => {
    setConversations((prev) =>
      prev.map((conversation) => (conversation.id === id ? { ...conversation, ...updater(conversation), updatedAt: new Date().toISOString() } : conversation))
    );
  };

  const deriveTurnLanguage = (text) => detectConversationLanguage(text, { conversationLanguage: activeConversation?.language, uiLanguage: i18n.language });

  const markTyped = (id) => {
    updateConversation(activeConversationId, (conversation) => ({
      messages: conversation.messages.map((message) => (message.id === id ? { ...message, pending: false } : message)),
    }));
  };

  const appendUserMessage = (content, language) => {
    updateConversation(activeConversationId, (conversation) => ({
      language: language || conversation.language,
      messages: [...conversation.messages, { id: nextId(), role: "user", content, pending: false }],
    }));
  };

  const appendAssistantMessage = ({ content, widget, actions }) => {
    updateConversation(activeConversationId, (conversation) => ({
      messages: [...conversation.messages, { id: nextId(), role: "assistant", content, widget, actions, pending: true }],
    }));
  };

  const runAction = (action, sourceText, explicitLanguage) => {
    const text = sourceText || t(action.labelKey);
    const language = explicitLanguage || deriveTurnLanguage(text);
    // `query` is the raw matched text — most actions ignore it (they only
    // need `t`/`language`), but a few (e.g. Reports' per-named-patient
    // queries) use it to tell "ahmed's..." apart from "sara's..." within
    // one registry entry instead of needing a separate action per name.
    const result = action.execute({ navigate, t, language, query: text });

    appendUserMessage(text, language);
    appendAssistantMessage({ content: result.content, widget: result.widget, actions: result.actions });
    setLastActionId(action.id);
    pulseSuccess();
  };

  /** Free-form text from EITHER composer (full workspace or drawer) — the ONE matching/fallback pipeline. */
  const submitQuery = (query) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const language = deriveTurnLanguage(trimmed);
    const matchedAction = matchAssistantAction(trimmed, language);

    if (matchedAction) {
      runAction(matchedAction, trimmed, language);
      return;
    }

    appendUserMessage(trimmed, language);
    const theme = matchCapabilityTheme(trimmed, language);
    const fallbackKey = theme ? theme.responseKey : "doctorDashboard.assistant.responses.unsupported";
    appendAssistantMessage({ content: t(fallbackKey, { lng: language }) });
    pulseSuccess();
  };

  const handleNavigateAction = (routeTo) => {
    if (routeTo) navigate(routeTo);
  };

  const handleNewChat = () => {
    const draft = createDraftConversation();
    setConversations((prev) => [...prev, draft]);
    setActiveConversationId(draft.id);
    setLastActionId(null);
  };

  const handleSelectConversation = (id) => {
    if (id === activeConversationId) return;
    setActiveConversationId(id);
    setLastActionId(null);
  };

  const value = {
    conversations,
    activeConversationId,
    activeConversation,
    messages,
    mode,
    orbState,
    setOrbState,
    suggestionActions,
    brief,
    displayName,
    greetingKey,
    runAction,
    submitQuery,
    markTyped,
    handleNewChat,
    handleSelectConversation,
    handleNavigateAction,
  };

  return <DoctorAssistantContext.Provider value={value}>{children}</DoctorAssistantContext.Provider>;
};

export const useDoctorAssistant = () => {
  const context = useContext(DoctorAssistantContext);
  if (!context) {
    throw new Error("useDoctorAssistant must be used within a DoctorAssistantProvider");
  }
  return context;
};
