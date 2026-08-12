import React, { useState } from "react";
import DoctorLayout from "../components/DoctorLayout";
import DoctorHomeAssistant from "../components/assistant/DoctorHomeAssistant";
import "../styles/DoctorDashboard.css";

/**
 * Doctor Home — "KneeGuide Clinical Command Center". The old generic
 * admin-dashboard composition (3 giant purple KPI cards, a decorative
 * "Patient Improvement" line chart, a raw appointments table, a raw
 * patient list, three floating quick-action buttons) is gone; every piece
 * of information it showed is still available, just relocated:
 *
 *   - activePatients (42)      -> removed outright. Audited: this number
 *     was never backed by any real or centrally-defined patient count
 *     anywhere in the app (DoctorPatients.jsx's own mock list has a
 *     different, smaller count) — carrying it forward would have meant
 *     inventing a number, not preserving one. Doctor Patients (unchanged
 *     by this task) remains the place to see the real patient roster.
 *   - todayAppointments (7)    -> DoctorHomeAssistant's Clinical Brief +
 *     the DOCTOR_TODAY_APPOINTMENTS assistant answer, both reading
 *     data/doctorClinicalMockData.js's getTodayAppointments().
 *   - newReports (4)           -> Clinical Brief + DOCTOR_REPORT_SUMMARY,
 *     reading getNewReports().
 *   - the appointments table / patient list / chart's implied "who needs
 *     attention" -> DOCTOR_ATTENTION_PATIENTS / DOCTOR_ADHERENCE_RISK,
 *     reading assistant/doctorClinicalInsights.js.
 *   - "+ New appointment" / "+ New report" / "View patients" -> audited:
 *     "New report" never had a real report-creation destination (it
 *     navigated to the Reports LIST route under a misleading label); that
 *     quick action is dropped rather than kept as a dead-feeling button.
 *     "View patients" and "New appointment" (-> the real Doctor Calendar)
 *     were genuinely valid navigations — they're still reachable via the
 *     Doctor sidebar (unchanged by this task), so they aren't recreated
 *     as a second floating row here; DOCTOR_REPORT_SUMMARY's own action
 *     also link into Reports contextually.
 *
 * `homeMode` mirrors patient/pages/PatientDashboard.jsx's own
 * `onModeChange` pattern exactly — DoctorHomeAssistant reports its
 * Welcome/Conversation mode up so `.doctor-dashboard` can become the
 * height-bounded chat shell (`.doctor-dashboard--conversation`,
 * DoctorDashboard.css) only while a conversation is active; Welcome Mode
 * keeps this page's normal, unbounded flow untouched.
 */
const DoctorDashboard = () => {
  const [homeMode, setHomeMode] = useState("welcome");

  return (
    <DoctorLayout active="dashboard">
      <div className={`doctor-dashboard doctor-dashboard--${homeMode}`}>
        <DoctorHomeAssistant onModeChange={setHomeMode} />
      </div>
    </DoctorLayout>
  );
};

export default DoctorDashboard;
