import React, { useState } from "react";
import { useParams, useSearchParams, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import DoctorLayout from "../components/DoctorLayout";
import { useRehabPatient } from "../../../../domain/rehab/useRehabDomain";
import { ATTENTION_LEVEL, APPOINTMENT_STATUS } from "../../../../domain/rehab/rehabEnums";
import { ROUTES } from "../../../../utils/routes";
import OverviewTab from "../components/workspace/OverviewTab";
import RehabilitationTab from "../components/workspace/RehabilitationTab";
import SessionsTab from "../components/workspace/SessionsTab";
import ReportsTab from "../components/workspace/ReportsTab";
import AppointmentsTab from "../components/workspace/AppointmentsTab";
import ClinicalRecordTab from "../components/workspace/ClinicalRecordTab";
import ScheduleAppointmentModal from "../components/workspace/ScheduleAppointmentModal";
import "../styles/DoctorPatientWorkspace.css";

const TABS = ["overview", "rehabilitation", "sessions", "reports", "appointments", "clinicalRecord"];

const ATTENTION_LEVEL_KEY = {
  [ATTENTION_LEVEL.NEEDS_ATTENTION]: "needsAttention",
  [ATTENTION_LEVEL.REVIEW_RECOMMENDED]: "reviewRecommended",
  [ATTENTION_LEVEL.STABLE]: "stable",
};

/**
 * Doctor Patient WORKSPACE (Section 9-12 of the Doctor Patients module
 * brief) — replaces the old single, endlessly-stacked DoctorPatientProfile
 * page and the three separate DOCTOR_PATIENT_REPORTS/EXERCISES/
 * NEW_APPOINTMENT routes. One page, one persistent contextual header, and
 * a compact LOCAL tab bar (never a global Sidebar addition) switching
 * between Overview / Rehabilitation / Sessions / Reports / Appointments /
 * Clinical Record — all reading the SAME `useRehabPatient(patientId)`
 * bundle, so nothing on this page can disagree with itself.
 */
const DoctorPatientWorkspace = () => {
  const { t } = useTranslation();
  const { id: patientId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const requestedTab = searchParams.get("tab");
  const tab = TABS.includes(requestedTab) ? requestedTab : "overview";
  const setTab = (nextTab) => setSearchParams(nextTab === "overview" ? {} : { tab: nextTab });

  const bundle = useRehabPatient(patientId);

  if (!bundle) return <Navigate to={ROUTES.DOCTOR_PATIENTS} replace />;

  const { patient, priority, adherence, appointments } = bundle;
  const levelKey = ATTENTION_LEVEL_KEY[priority.level];
  const pendingAppointment = appointments.find(
    (appt) => appt.status === APPOINTMENT_STATUS.REQUESTED || appt.status === APPOINTMENT_STATUS.ALTERNATIVE_PROPOSED
  );

  return (
    <DoctorLayout active="patients">
      <div className="dw-page">
        <header className="dw-header">
          <div className="dw-header-identity">
            <span className="dw-avatar" aria-hidden="true">
              {patient.firstName[0]}
              {patient.lastName[0]}
            </span>
            <div>
              <h1>{patient.name}</h1>
              <p className="dw-header-id">{patient.displayId}</p>
            </div>
          </div>

          <div className="dw-header-facts">
            <span className="dw-fact">{t(patient.diagnosisKey)}</span>
            <span className="dw-fact-sep">·</span>
            <span className="dw-fact">{t(`rehabDomain.phase.${patient.phaseKey}`)}</span>
            <span className="dw-fact-sep">·</span>
            <span className="dw-fact">{t("doctorPatientWorkspace.header.adherence", { value: adherence.percent ?? "—" })}</span>
            <span className={`dw-status-badge dw-status-badge--${levelKey}`}>{t(`rehabDomain.attentionLevel.${levelKey}`)}</span>
          </div>

          <div className="dw-header-actions">
            <button type="button" className="dw-btn-secondary" onClick={() => setTab("rehabilitation")}>
              {t("doctorPatientWorkspace.header.editPlan")}
            </button>
            <button type="button" className="dw-btn-primary" onClick={() => setScheduleOpen(true)}>
              {t("doctorPatientWorkspace.header.scheduleAppointment")}
            </button>
          </div>
        </header>

        {pendingAppointment && tab !== "appointments" && (
          <button type="button" className="dw-pending-banner" onClick={() => setTab("appointments")}>
            {t("doctorPatientWorkspace.pendingAppointmentBanner")}
          </button>
        )}

        <nav className="dw-tabs" role="tablist" aria-label={t("doctorPatientWorkspace.tabsLabel")}>
          {TABS.map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              className={`dw-tab ${tab === key ? "active" : ""}`}
              onClick={() => setTab(key)}
            >
              {t(`doctorPatientWorkspace.tabs.${key}`)}
            </button>
          ))}
        </nav>

        <div className="dw-content" role="tabpanel">
          {tab === "overview" && <OverviewTab bundle={bundle} onNavigateTab={setTab} />}
          {tab === "rehabilitation" && <RehabilitationTab bundle={bundle} />}
          {tab === "sessions" && <SessionsTab bundle={bundle} />}
          {tab === "reports" && <ReportsTab bundle={bundle} />}
          {tab === "appointments" && <AppointmentsTab bundle={bundle} onScheduleNew={() => setScheduleOpen(true)} />}
          {tab === "clinicalRecord" && <ClinicalRecordTab bundle={bundle} />}
        </div>
      </div>

      <ScheduleAppointmentModal isOpen={scheduleOpen} onClose={() => setScheduleOpen(false)} patient={patient} />
    </DoctorLayout>
  );
};

export default DoctorPatientWorkspace;
