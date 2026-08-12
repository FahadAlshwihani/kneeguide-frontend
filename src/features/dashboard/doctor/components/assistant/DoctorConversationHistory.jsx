import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { LuPlus, LuX, LuHistory } from "react-icons/lu";
import { getSidebarToggleIcon } from "../../../../../components/ui/sidebarToggleIcon";
import "./DoctorConversationHistory.css";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const isSameCalendarDay = (isoA, isoB) => {
  const a = new Date(isoA);
  const b = new Date(isoB);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
};

const groupConversations = (conversations) => {
  const now = Date.now();
  const sorted = [...conversations].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  const today = [];
  const previous = [];
  sorted.forEach((conversation) => {
    (isSameCalendarDay(conversation.updatedAt, now) ? today : previous).push(conversation);
  });
  return { today, previous };
};

// `titleKey` (seeded/demo conversations, doctorAssistantMockHistory.js) is
// resolved fresh on every render so it follows the active dashboard
// language immediately — the same reasoning as ConversationTurn's own
// `contentKey` resolution in DoctorHomeAssistant.jsx. A live conversation
// never has a title/titleKey; its fallback (first user message) also
// needs the same contentKey check, since a live conversation started from
// a seeded one could mix both message shapes.
const getConversationTitle = (conversation, t) => {
  if (conversation.titleKey) return t(conversation.titleKey);
  if (conversation.title) return conversation.title;
  const firstUserMessage = conversation.messages.find((message) => message.role === "user");
  const raw = (firstUserMessage?.contentKey ? t(firstUserMessage.contentKey, firstUserMessage.values) : firstUserMessage?.content)?.trim();
  if (!raw) return t("doctorDashboard.assistant.history.untitled");
  return raw.length > 42 ? `${raw.slice(0, 42)}…` : raw;
};

const ConversationRow = ({ conversation, isActive, onSelect, t, locale }) => (
  <li>
    <button
      type="button"
      className={`doctor-history-row${isActive ? " doctor-history-row--active" : ""}`}
      onClick={() => onSelect(conversation.id)}
      aria-current={isActive ? "true" : undefined}
    >
      <span className="doctor-history-row-main">
        <span className="doctor-history-row-title" dir="auto">
          {getConversationTitle(conversation, t)}
        </span>
        <span className="doctor-history-row-meta">
          {new Date(conversation.updatedAt).toLocaleDateString(locale, { month: "short", day: "numeric" })}
          {conversation.isMockHistory && <span className="doctor-history-row-badge">{t("doctorDashboard.assistant.history.mockBadge")}</span>}
        </span>
      </span>
    </button>
  </li>
);

const ConversationListBody = ({ conversations, activeConversationId, onSelect, t, locale }) => {
  const visible = conversations.filter((conversation) => conversation.isMockHistory || conversation.messages.length > 0);
  const { today, previous } = groupConversations(visible);

  if (visible.length === 0) {
    return <p className="doctor-history-empty">{t("doctorDashboard.assistant.history.empty")}</p>;
  }

  return (
    <>
      {today.length > 0 && (
        <div className="doctor-history-group">
          <p className="doctor-history-group-label">{t("doctorDashboard.assistant.history.today")}</p>
          <ul className="doctor-history-list">
            {today.map((conversation) => (
              <ConversationRow key={conversation.id} conversation={conversation} isActive={conversation.id === activeConversationId} onSelect={onSelect} t={t} locale={locale} />
            ))}
          </ul>
        </div>
      )}
      {previous.length > 0 && (
        <div className="doctor-history-group">
          <p className="doctor-history-group-label">{t("doctorDashboard.assistant.history.previous")}</p>
          <ul className="doctor-history-list">
            {previous.map((conversation) => (
              <ConversationRow key={conversation.id} conversation={conversation} isActive={conversation.id === activeConversationId} onSelect={onSelect} t={t} locale={locale} />
            ))}
          </ul>
        </div>
      )}
    </>
  );
};

/**
 * Doctor's own conversation-history rail/drawer — NOT a reuse of
 * patient/components/PatientConversationHistory.jsx. That component is
 * genuinely generic in its INTERACTION architecture (rail + drawer
 * variants, grouping, focus/Escape handling), but every user-visible
 * string and CSS class it renders is hardcoded to `patientDashboard.
 * assistant.history.*` / `.patient-history-*` — parameterizing that
 * (translation-key namespace + class prefix as props) would mean editing
 * a working, already-shipped Patient component to add doctor-facing
 * flexibility it doesn't otherwise need, for a save of ~170 lines. This
 * file intentionally mirrors that proven pattern/structure exactly
 * instead, with its own doctor-owned keys/classes, per the task's own
 * "keep role-specific logic separate" direction.
 */
const DoctorConversationHistory = ({ variant, conversations, activeConversationId, onSelect, onNewChat, collapsed = false, onToggleCollapse, isOpen = false, onClose }) => {
  const { t, i18n } = useTranslation();
  const reducedMotion = prefersReducedMotion();
  const panelRef = useRef(null);
  const isRTL = i18n.language === "ar";
  const offscreenX = isRTL ? "100%" : "-100%";

  const handleSelect = (id) => {
    onSelect(id);
    if (variant === "drawer") onClose?.();
  };

  const handleNewChat = () => {
    onNewChat();
    if (variant === "drawer") onClose?.();
  };

  useEffect(() => {
    if (variant !== "drawer" || !isOpen) return undefined;

    const panel = panelRef.current;
    const focusable = panel?.querySelector("button, [href], input, [tabindex]:not([tabindex='-1'])");
    focusable?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [variant, isOpen, onClose]);

  if (variant === "rail") {
    // Same fix/reasoning as PatientConversationHistory.jsx's rail toggle —
    // see components/ui/sidebarToggleIcon.js.
    const ToggleIcon = getSidebarToggleIcon({ isRTL, isCollapsed: collapsed });

    return (
      <nav className={`doctor-history-rail${collapsed ? " doctor-history-rail--collapsed" : ""}`} aria-label={t("doctorDashboard.assistant.history.title")}>
        <div className="doctor-history-rail-top">
          <button type="button" className="doctor-history-new-chat" onClick={handleNewChat} aria-label={t("doctorDashboard.assistant.history.newChat")} title={t("doctorDashboard.assistant.history.newChat")}>
            <LuPlus aria-hidden="true" />
            {!collapsed && <span>{t("doctorDashboard.assistant.history.newChat")}</span>}
          </button>
          <button
            type="button"
            className="doctor-history-collapse-toggle"
            onClick={onToggleCollapse}
            aria-label={t(collapsed ? "doctorDashboard.assistant.history.expand" : "doctorDashboard.assistant.history.collapse")}
            title={t(collapsed ? "doctorDashboard.assistant.history.expand" : "doctorDashboard.assistant.history.collapse")}
          >
            <ToggleIcon aria-hidden="true" />
          </button>
        </div>

        {!collapsed && (
          <div className="doctor-history-rail-body">
            <ConversationListBody conversations={conversations} activeConversationId={activeConversationId} onSelect={handleSelect} t={t} locale={i18n.language} />
          </div>
        )}
      </nav>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="doctor-history-backdrop"
            className="doctor-history-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.18 }}
            onClick={onClose}
          />
          <motion.div
            key="doctor-history-drawer"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={t("doctorDashboard.assistant.history.title")}
            className="doctor-history-drawer"
            initial={reducedMotion ? { opacity: 0 } : { x: offscreenX }}
            animate={reducedMotion ? { opacity: 1 } : { x: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { x: offscreenX }}
            transition={{ duration: reducedMotion ? 0.15 : 0.28, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <div className="doctor-history-drawer-header">
              <p className="doctor-history-drawer-title">{t("doctorDashboard.assistant.history.title")}</p>
              <button type="button" className="doctor-history-icon-button" onClick={onClose} aria-label={t("doctorDashboard.assistant.history.closeHistory")}>
                <LuX aria-hidden="true" />
              </button>
            </div>

            <button type="button" className="doctor-history-new-chat doctor-history-new-chat--drawer" onClick={handleNewChat}>
              <LuPlus aria-hidden="true" />
              <span>{t("doctorDashboard.assistant.history.newChat")}</span>
            </button>

            <div className="doctor-history-drawer-body">
              <ConversationListBody conversations={conversations} activeConversationId={activeConversationId} onSelect={handleSelect} t={t} locale={i18n.language} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export const DoctorHistoryTrigger = ({ onClick, triggerRef }) => {
  const { t } = useTranslation();
  return (
    <button type="button" ref={triggerRef} className="doctor-history-icon-button" onClick={onClick} aria-label={t("doctorDashboard.assistant.history.openHistory")} title={t("doctorDashboard.assistant.history.openHistory")}>
      <LuHistory aria-hidden="true" />
    </button>
  );
};

export default DoctorConversationHistory;
