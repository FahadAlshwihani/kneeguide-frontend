import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import TypewriterText from "../../../patient/components/TypewriterText";
import { DoctorAttentionList, DoctorAppointmentList, DoctorReportList, DoctorAppointmentRequestList } from "./DoctorClinicalMessage";

/**
 * One conversation turn — the ONE message renderer shared by the full
 * Doctor Home workspace (DoctorHomeAssistant.jsx) and the Topbar Assistant
 * Drawer (DoctorAssistantDrawer.jsx), extracted out of
 * DoctorHomeAssistant.jsx so the drawer never needs its own copy of
 * widget/action rendering (Section 10's "do not build a second assistant
 * engine" — this is the message-rendering half of that, the conversation-
 * state half lives in DoctorAssistantContext.jsx). Presentation-only,
 * exactly as before: `pending` is the sole Typewriter gate, `onNavigate`
 * turns a message's plain `{ id, labelKey, routeTo }` action descriptors
 * into a real route change.
 *
 * Seeded/demo messages (doctorAssistantMockHistory.js) store a
 * `contentKey` + `values` pair instead of an already-rendered `content`
 * string, specifically so they re-render in the currently active
 * dashboard language rather than staying frozen in whatever language they
 * were authored in. Live/runtime messages resolve `content` once, in the
 * detected INPUT language for that turn — `resolveMessageText` is the one
 * place both shapes funnel through.
 */
export const resolveMessageText = (message, t) => (message.contentKey ? t(message.contentKey, message.values) : message.content);

const DoctorConversationTurn = ({ message, scrollRef, reducedMotion, onTypedComplete, onNavigate, compact = false }) => {
  const { t } = useTranslation();
  const text = resolveMessageText(message, t);

  if (message.role === "user") {
    return (
      <motion.div
        ref={scrollRef}
        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.25, ease: "easeOut" }}
        className="doctor-chat-turn doctor-chat-turn--user"
      >
        <span className="doctor-visually-hidden">{t("doctorDashboard.assistant.youLabel")}</span>
        <p className="doctor-chat-bubble" dir="auto">
          {text}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.25, ease: "easeOut" }}
      className="doctor-chat-turn doctor-chat-turn--assistant"
    >
      <span className="doctor-chat-turn-label">{t("doctorDashboard.assistant.orbLabel")}</span>

      {message.pending ? (
        <TypewriterText as="p" className="doctor-chat-text" dir="auto" text={text} onComplete={onTypedComplete} visuallyHiddenClassName="doctor-visually-hidden" />
      ) : (
        <p className="doctor-chat-text" dir="auto">
          {text}
        </p>
      )}

      {/* The drawer's own compact preview omits structured widgets/action
          rows — it shows the prose reply and defers detail to "Open full
          assistant" (Section 9's own "conversation preview", not a second
          full rendering surface for every widget type). */}
      {!compact && message.widget?.type === "attentionList" && (
        <div className="doctor-chat-widget">
          <DoctorAttentionList items={message.widget.items} onNavigate={onNavigate} />
        </div>
      )}

      {!compact && message.widget?.type === "appointmentList" && (
        <div className="doctor-chat-widget">
          <DoctorAppointmentList items={message.widget.items} />
        </div>
      )}

      {!compact && message.widget?.type === "reportList" && (
        <div className="doctor-chat-widget">
          <DoctorReportList items={message.widget.items} />
        </div>
      )}

      {!compact && message.widget?.type === "appointmentRequestList" && (
        <div className="doctor-chat-widget">
          <DoctorAppointmentRequestList items={message.widget.items} onNavigate={onNavigate} />
        </div>
      )}

      {/* Action buttons are normally a navigation `{ id, labelKey, routeTo }`
          descriptor; SCHEDULE_APPOINTMENT's per-patient buttons instead
          carry a pre-resolved `label` (a real patient name, not a
          translation key — i18next has no key for "Ahmed Ali"), so the
          renderer prefers `label` when present. */}
      {!compact && message.actions && message.actions.length > 0 && (
        <div className="doctor-chat-actions">
          {message.actions.map((action) => (
            <button key={action.id} type="button" className="doctor-chat-action-btn" onClick={() => onNavigate(action.routeTo)}>
              {action.label || t(action.labelKey)}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default DoctorConversationTurn;
