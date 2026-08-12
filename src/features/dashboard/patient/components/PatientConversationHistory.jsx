import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { LuPlus, LuX, LuHistory } from "react-icons/lu";
import { getSidebarToggleIcon } from "../../../../components/ui/sidebarToggleIcon";
import "./PatientConversationHistory.css";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const isSameCalendarDay = (isoA, isoB) => {
  const a = new Date(isoA);
  const b = new Date(isoB);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
};

// Deliberately just two buckets (Section 27's own "keep simple" direction)
// — a handful of fixture + in-session conversations doesn't justify
// calendar-style month/week grouping, though nothing here blocks adding
// that later (this is the one place grouping logic lives).
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

const getConversationTitle = (conversation, t) => {
  if (conversation.title) return conversation.title;
  const firstUserMessage = conversation.messages.find((message) => message.role === "user");
  const raw = firstUserMessage?.content?.trim();
  if (!raw) return t("patientDashboard.assistant.history.untitled");
  return raw.length > 42 ? `${raw.slice(0, 42)}…` : raw;
};

const ConversationRow = ({ conversation, isActive, onSelect, t, locale }) => (
  <li>
    <button
      type="button"
      className={`patient-history-row${isActive ? " patient-history-row--active" : ""}`}
      onClick={() => onSelect(conversation.id)}
      aria-current={isActive ? "true" : undefined}
    >
      <span className="patient-history-row-main">
        <span className="patient-history-row-title" dir="auto">
          {getConversationTitle(conversation, t)}
        </span>
        <span className="patient-history-row-meta">
          {new Date(conversation.updatedAt).toLocaleDateString(locale, { month: "short", day: "numeric" })}
          {conversation.isMockHistory && (
            <span className="patient-history-row-badge">{t("patientDashboard.assistant.history.mockBadge")}</span>
          )}
        </span>
      </span>
    </button>
  </li>
);

const ConversationListBody = ({ conversations, activeConversationId, onSelect, t, locale }) => {
  const visible = conversations.filter((conversation) => conversation.isMockHistory || conversation.messages.length > 0);
  const { today, previous } = groupConversations(visible);

  if (visible.length === 0) {
    return <p className="patient-history-empty">{t("patientDashboard.assistant.history.empty")}</p>;
  }

  return (
    <>
      {today.length > 0 && (
        <div className="patient-history-group">
          <p className="patient-history-group-label">{t("patientDashboard.assistant.history.today")}</p>
          <ul className="patient-history-list">
            {today.map((conversation) => (
              <ConversationRow
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === activeConversationId}
                onSelect={onSelect}
                t={t}
                locale={locale}
              />
            ))}
          </ul>
        </div>
      )}
      {previous.length > 0 && (
        <div className="patient-history-group">
          <p className="patient-history-group-label">{t("patientDashboard.assistant.history.previous")}</p>
          <ul className="patient-history-list">
            {previous.map((conversation) => (
              <ConversationRow
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === activeConversationId}
                onSelect={onSelect}
                t={t}
                locale={locale}
              />
            ))}
          </ul>
        </div>
      )}
    </>
  );
};

/**
 * ONE component for both the desktop rail and the mobile drawer — they
 * share the exact same row/group markup (ConversationListBody) so there
 * is no separate, visually-duplicated history renderer to keep in sync
 * (mirrors the existing ConversationTurn precedent of "same renderer,
 * different state/props", not "two components").
 *
 * `variant="rail"`: always mounted on desktop, collapsible in place.
 * `variant="drawer"`: mobile-only overlay, mounted only while `isOpen`
 * (via AnimatePresence in the parent) — Escape/backdrop close it, initial
 * focus moves into the panel; returning focus to whatever opened it is the
 * parent's job (it owns that trigger button's ref).
 */
const PatientConversationHistory = ({
  variant,
  conversations,
  activeConversationId,
  onSelect,
  onNewChat,
  collapsed = false,
  onToggleCollapse,
  isOpen = false,
  onClose,
}) => {
  const { t, i18n } = useTranslation();
  const reducedMotion = prefersReducedMotion();
  const panelRef = useRef(null);
  // The drawer is CSS-anchored to `inset-inline-start` (see the .css file),
  // which resolves to the physical left edge in LTR and the physical
  // right edge in RTL — so the offscreen entry transform (a physical
  // translateX) has to flip sign with it, or an RTL drawer would slide in
  // from the wrong side. UI language (not conversation language) is the
  // right source of truth here, since this is layout chrome.
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
    // The rail is always the first flex child of `.patient-home-workspace`
    // (row direction, positioned by normal flow) — its physical side flips
    // with direction on its own, so the icon that describes "collapse"/
    // "expand" must too (see components/ui/sidebarToggleIcon.js).
    const ToggleIcon = getSidebarToggleIcon({ isRTL, isCollapsed: collapsed });

    return (
      <nav
        className={`patient-history-rail${collapsed ? " patient-history-rail--collapsed" : ""}`}
        aria-label={t("patientDashboard.assistant.history.title")}
      >
        <div className="patient-history-rail-top">
          <button
            type="button"
            className="patient-history-new-chat"
            onClick={handleNewChat}
            aria-label={t("patientDashboard.assistant.history.newChat")}
            title={t("patientDashboard.assistant.history.newChat")}
          >
            <LuPlus aria-hidden="true" />
            {!collapsed && <span>{t("patientDashboard.assistant.history.newChat")}</span>}
          </button>
          <button
            type="button"
            className="patient-history-collapse-toggle"
            onClick={onToggleCollapse}
            aria-label={t(
              collapsed ? "patientDashboard.assistant.history.expand" : "patientDashboard.assistant.history.collapse"
            )}
            title={t(
              collapsed ? "patientDashboard.assistant.history.expand" : "patientDashboard.assistant.history.collapse"
            )}
          >
            <ToggleIcon aria-hidden="true" />
          </button>
        </div>

        {!collapsed && (
          <div className="patient-history-rail-body">
            <ConversationListBody
              conversations={conversations}
              activeConversationId={activeConversationId}
              onSelect={handleSelect}
              t={t}
              locale={i18n.language}
            />
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
            key="patient-history-backdrop"
            className="patient-history-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.18 }}
            onClick={onClose}
          />
          <motion.div
            key="patient-history-drawer"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={t("patientDashboard.assistant.history.title")}
            className="patient-history-drawer"
            initial={reducedMotion ? { opacity: 0 } : { x: offscreenX }}
            animate={reducedMotion ? { opacity: 1 } : { x: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { x: offscreenX }}
            transition={{ duration: reducedMotion ? 0.15 : 0.28, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <div className="patient-history-drawer-header">
              <p className="patient-history-drawer-title">{t("patientDashboard.assistant.history.title")}</p>
              <button
                type="button"
                className="patient-history-icon-button"
                onClick={onClose}
                aria-label={t("patientDashboard.assistant.history.closeHistory")}
              >
                <LuX aria-hidden="true" />
              </button>
            </div>

            <button type="button" className="patient-history-new-chat patient-history-new-chat--drawer" onClick={handleNewChat}>
              <LuPlus aria-hidden="true" />
              <span>{t("patientDashboard.assistant.history.newChat")}</span>
            </button>

            <div className="patient-history-drawer-body">
              <ConversationListBody
                conversations={conversations}
                activeConversationId={activeConversationId}
                onSelect={handleSelect}
                t={t}
                locale={i18n.language}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export const PatientHistoryTrigger = ({ onClick, triggerRef }) => {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      ref={triggerRef}
      className="patient-history-icon-button"
      onClick={onClick}
      aria-label={t("patientDashboard.assistant.history.openHistory")}
      title={t("patientDashboard.assistant.history.openHistory")}
    >
      <LuHistory aria-hidden="true" />
    </button>
  );
};

export default PatientConversationHistory;
