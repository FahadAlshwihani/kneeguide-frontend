import React, { useMemo, useState } from "react";
import { useParams, useSearchParams, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LuCalendarClock } from "react-icons/lu";
import DoctorLayout from "../components/DoctorLayout";
import { useRehabPatient } from "../../../../domain/rehab/useRehabDomain";
import { APPOINTMENT_STATUS, ATTENTION_LEVEL_I18N_KEY } from "../../../../domain/rehab/rehabEnums";
import { ROUTES } from "../../../../utils/routes";
import {
  buildOverviewInsight,
  buildClinicalInsight,
  buildLatestSessionInsight,
  buildReportInsight,
  buildAppointmentInsight,
  buildClinicalNoteInsight,
} from "../assistant/doctorAssistantInsights";
import AssistantInsightCard from "../components/workspace/AssistantInsightCard";
import OverviewTab from "../components/workspace/OverviewTab";
import RehabilitationTab from "../components/workspace/RehabilitationTab";
import SessionsTab from "../components/workspace/SessionsTab";
import ReportsTab from "../components/workspace/ReportsTab";
import AppointmentsTab from "../components/workspace/AppointmentsTab";
import ClinicalRecordTab from "../components/workspace/ClinicalRecordTab";
import DoctorAppointmentComposer from "../components/workspace/DoctorAppointmentComposer";
import "../styles/DoctorPatientWorkspace.css";

const TABS = ["overview", "rehabilitation", "sessions", "reports", "appointments", "clinicalRecord"];

/**
 * ONE insight descriptor per tab, computed here at the shell level instead
 * of inside each tab component (Section 4 of the visual-polish brief — the
 * ORB FLICKER root cause: OverviewTab/RehabilitationTab/SessionsTab/etc
 * are distinct components, so a `<AssistantInsightCard>` rendered inside
 * each one gets unmounted and a brand new one (with a brand new WebGL
 * `<Orb>` — see components/ui/Orb.jsx's mount-once effect) remounted on
 * every tab click. Hoisting ONE `<AssistantInsightCard>` to this
 * always-mounted shell, feeding it whichever descriptor the active tab
 * needs, means the Orb's canvas/WebGL context is created exactly once per
 * patient and never touched again on tab navigation — no lifecycle
 * change to Orb.jsx itself, no derivation-logic change, purely a
 * relocation of WHERE these same pure functions are called from.
 */
const computeTabInsight = (tab, bundle) => {
  if (tab === "overview") {
    const overview = buildOverviewInsight(bundle);
    const lines = [overview.clinical, overview.report, overview.appointment]
      .filter(Boolean)
      .map((part) => ({ messageKey: part.messageKey, values: part.values }));
    return { severity: overview.severity, lines, actions: overview.actions };
  }
  if (tab === "rehabilitation") {
    const clinical = buildClinicalInsight(bundle);
    return { severity: clinical.severity, lines: [{ messageKey: clinical.messageKey, values: clinical.values }], actions: clinical.actions };
  }
  if (tab === "sessions") {
    const session = buildLatestSessionInsight(bundle);
    if (!session) return null;
    return { severity: session.severity, lines: [{ messageKey: session.messageKey, values: session.values }], actions: session.actions };
  }
  if (tab === "reports") {
    const report = buildReportInsight(bundle);
    if (!report) return null;
    return { severity: report.severity, lines: [{ messageKey: report.messageKey, values: report.values }], actions: report.actions };
  }
  if (tab === "appointments") {
    const appointment = buildAppointmentInsight(bundle);
    if (!appointment) return null;
    const clinical = buildClinicalInsight(bundle);
    const lines = [
      { messageKey: appointment.messageKey, values: appointment.values },
      clinical.category === "clinical" && { messageKey: "doctorAssistantInsights.appointment.clinicalContext", values: {} },
    ].filter(Boolean);
    return { severity: appointment.severity, lines, actions: appointment.actions };
  }
  if (tab === "clinicalRecord") {
    const note = buildClinicalNoteInsight(bundle);
    if (!note) return null;
    return { severity: note.severity, lines: [{ messageKey: note.messageKey, values: note.values }], actions: [] };
  }
  return null;
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
  // Same pattern as `useRehabPatient` itself: called unconditionally,
  // before the invalid-patient-id early return below, so hook order never
  // changes across renders.
  const tabInsight = useMemo(() => (bundle ? computeTabInsight(tab, bundle) : null), [tab, bundle]);

  if (!bundle) return <Navigate to={ROUTES.DOCTOR_PATIENTS} replace />;

  const { patient, priority, adherence, appointments } = bundle;
  const levelKey = ATTENTION_LEVEL_I18N_KEY[priority.level];
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
            <LuCalendarClock aria-hidden="true" />
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

        {/* ONE Orb instance for the entire workspace session (see
            computeTabInsight's own comment above) — content swaps per
            tab, the Orb/card element itself never unmounts. */}
        {tabInsight && <AssistantInsightCard severity={tabInsight.severity} lines={tabInsight.lines} actions={tabInsight.actions} />}

        <div className="dw-content" role="tabpanel">
          {tab === "overview" && <OverviewTab bundle={bundle} onNavigateTab={setTab} />}
          {tab === "rehabilitation" && <RehabilitationTab bundle={bundle} />}
          {tab === "sessions" && <SessionsTab bundle={bundle} />}
          {tab === "reports" && <ReportsTab bundle={bundle} />}
          {tab === "appointments" && <AppointmentsTab bundle={bundle} onScheduleNew={() => setScheduleOpen(true)} />}
          {tab === "clinicalRecord" && <ClinicalRecordTab bundle={bundle} />}
        </div>
      </div>

      <DoctorAppointmentComposer
        isOpen={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        patientId={patient.id}
        onReviewExisting={() => setTab("appointments")}
      />
    </DoctorLayout>
  );
};

export default DoctorPatientWorkspace;
