// src/pages/PatientDashboard.jsx
import React from "react";
import { useTranslation } from "react-i18next";
import "../styles/PatientDashboard.css";
import PatientHomeAssistant from "../components/PatientHomeAssistant";

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
 */
const PatientDashboard = () => {
  const { t } = useTranslation();

  // =======================
  // MOCK DATA — unchanged from the previous dashboard
  // =======================
  const nextAppointment = {
    date: "2025-11-25",
    time: "03:30 PM",
    doctor: "Dr. Sarah Ahmed",
    type: t("patientDashboard.mock.nextAppointment.type"),
    location: t("patientDashboard.mock.nextAppointment.location"),
  };

  const lastReport = {
    date: "2025-11-17",
    painLevel: "3/10",
    statusLabel: t("patientDashboard.mock.lastReport.statusLabel"),
  };

  const adherence = {
    streakDays: 5,
    completionPercentage: 76,
    missedThisWeek: 1,
  };

  const assistantData = { nextAppointment, lastReport, adherence };

  return (
    <div className="pd-page">
      <div className="pd-inner">
        <PatientHomeAssistant data={assistantData} />
      </div>
    </div>
  );
};

export default PatientDashboard;
