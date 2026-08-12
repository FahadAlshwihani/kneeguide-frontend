import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { LuX, LuSendHorizontal } from "react-icons/lu";
import { useDoctorAssistant } from "../../assistant/DoctorAssistantContext";
import { getContextualSuggestions } from "../../assistant/doctorAssistantSuggestions";
import { ROUTES } from "../../../../../utils/routes";
import DoctorClinicalOrb from "../assistant/DoctorClinicalOrb";
import DoctorConversationTurn from "../assistant/DoctorConversationTurn";
import "./DoctorAssistantDrawer.css";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Only the most recent few turns — this is a "conversation preview"
// (Section 9), not a second full transcript; "Open full assistant" is the
// way to see everything.
const PREVIEW_MESSAGE_COUNT = 6;

/**
 * The quick Assistant Drawer (Section 9-11) — reads/writes the EXACT same
 * conversation state as the full Doctor Home workspace via
 * useDoctorAssistant() (DoctorAssistantContext.jsx, mounted once by
 * DoctorDashboardShell.jsx). No second matching engine, no second
 * conversation store, no second message renderer (DoctorConversationTurn
 * is shared with DoctorHomeAssistant.jsx) — this really is "the same
 * assistant, a quicker door into it," not a parallel one.
 *
 * Suggestions are contextual to the current ROUTE (doctorAssistantSuggestions.js)
 * — still the same 5-action registry, just a different subset/order per
 * page, never fabricated page-specific capabilities.
 */
const DoctorAssistantDrawer = ({ isOpen, onClose, triggerRef }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const reducedMotion = prefersReducedMotion();
  const panelRef = useRef(null);
  const previewRef = useRef(null);

  const { messages, mode, orbState, setOrbState, brief, displayName, greetingKey, runAction, submitQuery, markTyped, handleNavigateAction } = useDoctorAssistant();

  const [inputValue, setInputValue] = useState("");

  const isRTL = i18n.language === "ar";
  const offscreenX = isRTL ? "-100%" : "100%";

  const contextualSuggestions = useMemo(() => getContextualSuggestions(pathname), [pathname]);
  const previewMessages = messages.slice(-PREVIEW_MESSAGE_COUNT);

  useEffect(() => {
    if (!isOpen) return undefined;

    const panel = panelRef.current;
    const focusable = panel?.querySelector("input, button, [href], [tabindex]:not([tabindex='-1'])");
    focusable?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        triggerRef?.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, triggerRef]);

  useEffect(() => {
    if (!isOpen) return;
    const el = previewRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [isOpen, previewMessages.length]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const query = inputValue.trim();
    if (!query) return;
    setInputValue("");
    submitQuery(query);
  };

  const handleOpenFull = () => {
    navigate(ROUTES.DOCTOR_DASHBOARD);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="doctor-assistant-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.18 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={t("doctorDashboard.assistant.orbLabel")}
            className="doctor-assistant-drawer"
            initial={reducedMotion ? { opacity: 0 } : { x: offscreenX, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { x: offscreenX, opacity: 0 }}
            transition={{ duration: reducedMotion ? 0.15 : 0.26, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <div className="doctor-assistant-drawer-header">
              <DoctorClinicalOrb state={orbState} size="tiny" className="doctor-assistant-drawer-orb" />
              <span className="doctor-assistant-drawer-title">{t("doctorDashboard.assistant.orbLabel")}</span>
              <button type="button" className="doctor-assistant-drawer-close" onClick={onClose} aria-label={t("doctorShell.assistantDrawer.close")}>
                <LuX aria-hidden="true" />
              </button>
            </div>

            <div className="doctor-assistant-drawer-body">
              {mode === "welcome" ? (
                <div className="doctor-assistant-drawer-welcome">
                  <p className="doctor-assistant-drawer-greeting">{t(`doctorDashboard.greeting.${greetingKey}`, { name: displayName })}</p>
                  <p className="doctor-assistant-drawer-brief">
                    {t("doctorDashboard.assistant.brief", { appointments: brief.appointmentsToday, reports: brief.newReports, attention: brief.needAttentionCount })}
                  </p>
                </div>
              ) : (
                <div ref={previewRef} className="doctor-assistant-drawer-preview" role="log" aria-label={t("doctorDashboard.assistant.historyLabel")}>
                  {previewMessages.map((message) => (
                    <DoctorConversationTurn
                      key={message.id}
                      message={message}
                      reducedMotion={reducedMotion}
                      onTypedComplete={() => markTyped(message.id)}
                      onNavigate={(routeTo) => {
                        handleNavigateAction(routeTo);
                        onClose();
                      }}
                      compact
                    />
                  ))}
                </div>
              )}

              <div className="doctor-assistant-drawer-suggestions">
                {contextualSuggestions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button key={action.id} type="button" className="doctor-assistant-drawer-chip" onClick={() => runAction(action)}>
                      <Icon aria-hidden="true" />
                      <span>{t(action.labelKey)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="doctor-assistant-drawer-footer">
              <form className="doctor-assistant-drawer-form" onSubmit={handleSubmit}>
                <label htmlFor="doctor-assistant-drawer-input" className="doctor-visually-hidden">
                  {t("doctorDashboard.assistant.inputLabel")}
                </label>
                <input
                  id="doctor-assistant-drawer-input"
                  type="text"
                  dir="auto"
                  className="doctor-assistant-drawer-input"
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  onFocus={() => setOrbState("engaged")}
                  onBlur={() => setOrbState("idle")}
                  placeholder={t("doctorDashboard.assistant.inputPlaceholder")}
                  autoComplete="off"
                />
                <button type="submit" className="doctor-assistant-drawer-send" aria-label={t("doctorDashboard.assistant.sendLabel")}>
                  <LuSendHorizontal aria-hidden="true" />
                </button>
              </form>

              <button type="button" className="doctor-assistant-drawer-open-full" onClick={handleOpenFull}>
                {t("doctorShell.assistantDrawer.openFull")}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DoctorAssistantDrawer;
