// src/pages/PatientDashboard.jsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import "../styles/PatientDashboard.css";
import PatientHomeAssistant from "../components/PatientHomeAssistant";
import { getAdherence } from "../data/patientRehabPlanData";

/**
 * Patient Home — entirely the KneeGuide Assistant conversation experience
 * (PatientHomeAssistant.jsx owns Welcome <-> Conversation mode, the Orb,
 * and the message history). This page's only remaining job is supplying
 * the same mock data the dashboard already used before this redesign
 * (unchanged shape/values — appointment/report/adherence still have no
 * backend, so there is still no real "loading"/"API error" state to show
 * here) and the page-level chrome (.pd-page/.pd-inner). The permanent
 * glanceable cards (next appointment / today's exercises / latest pain)
 * and the always-visible Pain Wheel section are gone — that data/capability
 * isn't deleted, it's reachable through the Assistant's own suggestions
 * (assistant/patientAssistantActions.js), including the Pain Wheel itself,
 * which now mounts inline inside a conversation turn instead of a
 * dashboard-style section (see PatientHomeAssistant.jsx's ConversationTurn).
 *
 * `homeMode` mirrors PatientHomeAssistant's own internal Welcome/
 * Conversation mode (reported up via `onModeChange`, purely for layout —
 * no assistant business logic lives here) so `.pd-page` can become the
 * bounded, non-document-scrolling chat shell ONLY while a conversation is
 * active (`.pd-page--conversation`, PatientDashboard.css) — Welcome Mode
 * keeps this page's original, unbounded normal-flow behavior untouched.
 */
const PatientDashboard = () => {
  const { t } = useTranslation();
  const [homeMode, setHomeMode] = useState("welcome");

  // =======================
  // MOCK DATA — unchanged from the previous dashboard
  // =======================
  // `nextAppointment` used to be a small inline mock object here — it's
  // gone. The Assistant's NEXT_APPOINTMENT action now reads directly from
  // appointments/patientAppointmentService.js (the same source
  // pages/PatientAppointments.jsx itself uses), so there is exactly one
  // appointment data source instead of this page and that action each
  // owning a disagreeing copy (Section 40).
  const lastReport = {
    date: "2025-11-17",
    painLevel: "3/10",
    statusLabel: t("patientDashboard.mock.lastReport.statusLabel"),
  };

  const adherence = getAdherence();

  const assistantData = { lastReport, adherence };

  return (
    <div className={`pd-page pd-page--${homeMode}`}>
      <div className="pd-inner">
        <PatientHomeAssistant data={assistantData} onModeChange={setHomeMode} />
      </div>
    </div>
  );
};

export default PatientDashboard;
