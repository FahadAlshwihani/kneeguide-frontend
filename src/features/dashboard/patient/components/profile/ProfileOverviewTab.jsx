import React from "react";
import { useTranslation } from "react-i18next";
import { LuStethoscope } from "react-icons/lu";
import KneeGuideInsightCard from "../exercises/KneeGuideInsightCard";
import PatientButton from "../PatientButton";
import { ROUTES } from "../../../../../utils/routes";
import { getWeekLabel } from "../../data/patientRehabPlanData";

/**
 * Overview tab — Section 6's four subsections (Recovery Profile / Personal
 * / Care Team / KneeGuide Insight). `clinician`/`nextAppointment` are
 * passed down already resolved (PatientProfile.jsx reads them from
 * DEFAULT_CLINICIAN + patientAppointmentService.getNextConfirmedAppointment
 * — the exact same source Patient Appointments and the Assistant's
 * NEXT_APPOINTMENT action use) rather than this component reaching into
 * either module itself, keeping data-fetching centralized in the page.
 */
const ProfileOverviewTab = ({ user, adherence, clinician, nextAppointment, insight }) => {
  const { t, i18n } = useTranslation();
  const weekLabel = t("patientExercises.session.weekLabel", { number: getWeekLabel() });

  return (
    <div className="pfl-tab-panel">
      <section className="pfl-card" aria-labelledby="pfl-recovery-heading">
        <h2 id="pfl-recovery-heading" className="pfl-card-title">
          {t("patientProfile.overview.recoveryProfile.title")}
        </h2>
        <div className="pfl-info-grid">
          <div className="pfl-info-item">
            <span>{t("patientProfile.overview.recoveryProfile.diagnosis")}</span>
            <p>{t(user.diagnosisKey)}</p>
          </div>
          <div className="pfl-info-item">
            <span>{t("patientProfile.overview.recoveryProfile.phase")}</span>
            <p>{t(`patientProfile.rehabPhase.${user.rehabPhaseKey}`)}</p>
          </div>
          <div className="pfl-info-item">
            <span>{t("patientProfile.overview.recoveryProfile.week")}</span>
            <p>{weekLabel}</p>
          </div>
          <div className="pfl-info-item">
            <span>{t("patientProfile.overview.recoveryProfile.surgeryDate")}</span>
            <p dir="ltr">{new Date(user.surgeryDate).toLocaleDateString(i18n.language, { year: "numeric", month: "short", day: "numeric" })}</p>
          </div>
        </div>
      </section>

      <section className="pfl-card" aria-labelledby="pfl-personal-heading">
        <h2 id="pfl-personal-heading" className="pfl-card-title">
          {t("patientProfile.overview.personal.title")}
        </h2>
        <div className="pfl-metric-grid">
          <div className="pfl-metric">
            <span>{t("patientProfile.overview.personal.age")}</span>
            <p>{t("patientProfile.overview.personal.ageValue", { count: user.age })}</p>
          </div>
          <div className="pfl-metric">
            <span>{t("patientProfile.overview.personal.height")}</span>
            <p dir="ltr">{t("patientProfile.overview.personal.heightValue", { value: user.height })}</p>
          </div>
          <div className="pfl-metric">
            <span>{t("patientProfile.overview.personal.weight")}</span>
            <p dir="ltr">{t("patientProfile.overview.personal.weightValue", { value: user.weight })}</p>
          </div>
          <div className="pfl-metric">
            <span>{t("patientProfile.overview.personal.goal")}</span>
            <p>{t(user.goalKey)}</p>
          </div>
        </div>
      </section>

      <section className="pfl-card" aria-labelledby="pfl-care-team-heading">
        <h2 id="pfl-care-team-heading" className="pfl-card-title">
          {t("patientProfile.overview.careTeam.title")}
        </h2>
        <div className="pfl-care-team-row">
          <div className="pfl-care-team-avatar" aria-hidden="true">
            <LuStethoscope />
          </div>
          <div className="pfl-care-team-body">
            <p className="pfl-care-team-name">{clinician.name}</p>
            <p className="pfl-care-team-specialty">{t(clinician.specialtyKey)}</p>
            {nextAppointment ? (
              <p className="pfl-care-team-appointment" dir="ltr">
                {t("patientProfile.overview.careTeam.nextAppointment", {
                  date: nextAppointment.startAt.toLocaleDateString(i18n.language, { month: "short", day: "numeric" }),
                  time: nextAppointment.startAt.toLocaleTimeString(i18n.language, { hour: "2-digit", minute: "2-digit" }),
                })}
              </p>
            ) : (
              <p className="pfl-care-team-appointment pfl-care-team-appointment--muted">{t("patientProfile.overview.careTeam.noAppointment")}</p>
            )}
          </div>
          <PatientButton to={ROUTES.PATIENT_APPOINTMENTS} variant="ghost" size="sm">
            {t("patientProfile.overview.careTeam.viewAppointments")}
          </PatientButton>
        </div>
      </section>

      {insight && (
        <KneeGuideInsightCard title={t("patientProfile.insight.title")} message={t(insight.messageKey, insight.values)} tone={insight.tone} />
      )}
    </div>
  );
};

export default ProfileOverviewTab;
