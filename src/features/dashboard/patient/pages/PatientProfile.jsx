import React from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../styles/PatientProfile.css";
import { useAuth } from "../../../../context/AuthContext";
import { useKneeGuideDevice } from "../device/KneeGuideDeviceContext";
import { getNextConfirmedAppointment } from "../appointments/patientAppointmentService";
import { DEFAULT_CLINICIAN } from "../data/patientClinicianData";
import { getAdherence } from "../data/patientRehabPlanData";
import { getPatientById, PATIENT_PROFILE_PATIENT_ID } from "../../../../domain/rehab/demoData/patients";
import { getOverviewInsight, getMedicalInsight, getRehabInsight, getDevicesInsight } from "../profile/patientProfileInsights";
import ProfileHero from "../components/profile/ProfileHero";
import ProfileOverviewTab from "../components/profile/ProfileOverviewTab";
import ProfileMedicalTab from "../components/profile/ProfileMedicalTab";
import ProfileRehabTab from "../components/profile/ProfileRehabTab";
import ProfileDevicesTab from "../components/profile/ProfileDevicesTab";
import ProfilePreferencesTab from "../components/profile/ProfilePreferencesTab";
import ProfileSecurityTab from "../components/profile/ProfileSecurityTab";

// Section 2's tab order — also the allowlist an incoming `?tab=` deep link
// is checked against (the Assistant's "Open Devices settings" secondary
// action links straight to `?tab=devices`, see patientAssistantActions.js).
// Anything missing/mistyped/stale (including the old "settings" tab this
// replaces) safely falls back to "overview" instead of a blank panel.
const PROFILE_TABS = ["overview", "medical", "rehab", "devices", "preferences", "security"];

/**
 * Patient Profile — the patient's recovery CONTROL CENTER (Profile V2),
 * not a generic settings page. Hero -> [Overview, Medical, Rehab, Devices,
 * Preferences, Security]. This page's own job is orchestration: it is the
 * ONE place that reads the canonical sources (clinician identity,
 * appointments, rehab plan/adherence, device capability) and hands already-
 * resolved data + one deterministic insight down to each tab component —
 * no tab component reaches into a data/service module a sibling tab
 * already read, and none of them own a second copy of anything.
 *
 * MOCK PATIENT PROFILE — there is no dedicated Profile API/data module in
 * this project (audited before this redesign); `user` below is the same
 * kind of local mock object PatientProfile.jsx has always used, now with
 * enum-like fields (`rehabPhaseKey`, `diagnosisKey`, `goalKey`,
 * `clinicalNoteKey`) expressed as i18next keys instead of raw hardcoded
 * English strings (Section 35), so both languages render correctly instead
 * of just English with a translated shell around it.
 */
const PatientProfile = () => {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const tab = PROFILE_TABS.includes(requestedTab) ? requestedTab : "overview";

  const setTab = (nextTab) => {
    setSearchParams(nextTab === "overview" ? {} : { tab: nextTab });
  };

  // Device state/logic is NOT owned here — the exact same shared
  // scan/connect capability the KneeGuide Assistant's "How do I connect my
  // device?" action uses (device/KneeGuideDeviceContext.jsx, mounted once
  // in PatientLayout.jsx). Profile and the Assistant are two interfaces
  // into one device capability, never two copies of it.
  const { scanning, devices, connectingDeviceId, connectedDevice, scanForDevices, connectToDevice, disconnectDevice } =
    useKneeGuideDevice();

  // Identity/diagnosis/phase/contact now come from the shared rehab
  // domain's canonical patient record (Section 35 of the Doctor Patients
  // module brief: "Doctor -> Ahmed Ali must represent THE SAME Ahmed") —
  // this is what makes a Doctor Workspace edit to Ahmed's diagnosis/phase
  // (were that ever added) show up here too, instead of two independent
  // copies. `height`/`weight`/`clinicalNoteKey` stay local: physical
  // stats and this page's own cosmetic summary blurb were never part of
  // the Doctor-side facts and have no cross-role consistency requirement.
  const canonicalPatient = getPatientById(PATIENT_PROFILE_PATIENT_ID);
  const user = {
    first_name: canonicalPatient.firstName,
    last_name: canonicalPatient.lastName,
    age: canonicalPatient.age,
    height: 178,
    weight: 82,
    goalKey: canonicalPatient.goalKey,
    diagnosisKey: canonicalPatient.diagnosisKey,
    surgeryDate: canonicalPatient.programStartDate,
    rehabPhaseKey: canonicalPatient.phaseKey,
    clinicalNoteKey: "patientProfile.mock.clinicalNote",
    email: canonicalPatient.email,
    phone: canonicalPatient.phone,
  };

  const avatarLetters = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();

  // Cheap synchronous reads — same "don't bother memoizing on a refresh
  // counter" call PatientAppointments.jsx already made for the same
  // reason (see that file's own comment).
  const adherence = getAdherence();
  const nextAppointment = getNextConfirmedAppointment();

  const overviewInsight = getOverviewInsight({ rehabPhase: t(`patientProfile.rehabPhase.${user.rehabPhaseKey}`), adherence });
  const medicalInsight = getMedicalInsight({ rehabPhase: t(`patientProfile.rehabPhase.${user.rehabPhaseKey}`) });
  const rehabInsight = getRehabInsight({ adherence });
  const devicesInsight = getDevicesInsight({ connectedDevice });

  return (
    <div className="pfl-page">
      <div className="pfl-inner">
        <ProfileHero user={user} avatarLetters={avatarLetters} />

        <nav className="pfl-tabs" aria-label={t("patientProfile.tabsLabel")}>
          {PROFILE_TABS.map((key) => (
            <button
              key={key}
              type="button"
              className={tab === key ? "active" : ""}
              aria-current={tab === key ? "page" : undefined}
              onClick={() => setTab(key)}
            >
              {t(`patientProfile.tabs.${key}`)}
            </button>
          ))}
        </nav>

        <div className="pfl-content">
          {tab === "overview" && (
            <ProfileOverviewTab user={user} adherence={adherence} clinician={DEFAULT_CLINICIAN} nextAppointment={nextAppointment} insight={overviewInsight} />
          )}
          {tab === "medical" && <ProfileMedicalTab user={user} insight={medicalInsight} />}
          {tab === "rehab" && <ProfileRehabTab rehabPhaseKey={user.rehabPhaseKey} insight={rehabInsight} />}
          {tab === "devices" && (
            <ProfileDevicesTab
              scanning={scanning}
              devices={devices}
              connectingDeviceId={connectingDeviceId}
              connectedDevice={connectedDevice}
              scanForDevices={scanForDevices}
              connectToDevice={connectToDevice}
              disconnectDevice={disconnectDevice}
              insight={devicesInsight}
            />
          )}
          {tab === "preferences" && <ProfilePreferencesTab />}
          {tab === "security" && <ProfileSecurityTab email={user.email} onLogout={logout} />}
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
