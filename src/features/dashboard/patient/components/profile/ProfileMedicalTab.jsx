import React from "react";
import { useTranslation } from "react-i18next";
import KneeGuideInsightCard from "../exercises/KneeGuideInsightCard";
import PatientButton from "../PatientButton";
import { ROUTES } from "../../../../../utils/routes";

/** Medical tab (Section 7/8) — structured rows, one contextual insight, one honest optional action. */
const ProfileMedicalTab = ({ user, insight }) => {
  const { t, i18n } = useTranslation();

  return (
    <div className="pfl-tab-panel">
      <section className="pfl-card" aria-labelledby="pfl-medical-heading">
        <h2 id="pfl-medical-heading" className="pfl-card-title">
          {t("patientProfile.medical.title")}
        </h2>
        <div className="pfl-row-list">
          <div className="pfl-row">
            <span>{t("patientProfile.medical.diagnosis")}</span>
            <p>{t(user.diagnosisKey)}</p>
          </div>
          <div className="pfl-row">
            <span>{t("patientProfile.medical.phase")}</span>
            <p>{t(`patientProfile.rehabPhase.${user.rehabPhaseKey}`)}</p>
          </div>
          <div className="pfl-row">
            <span>{t("patientProfile.medical.surgeryDate")}</span>
            <p dir="ltr">{new Date(user.surgeryDate).toLocaleDateString(i18n.language, { year: "numeric", month: "short", day: "numeric" })}</p>
          </div>
          <div className="pfl-row pfl-row--note">
            <span>{t("patientProfile.medical.note")}</span>
            <p>{t(user.clinicalNoteKey)}</p>
          </div>
        </div>
      </section>

      {insight && (
        <KneeGuideInsightCard title={t("patientProfile.insight.title")} message={t(insight.messageKey, insight.values)} tone={insight.tone}>
          <PatientButton to={ROUTES.PATIENT_REPORTS} variant="ghost" size="sm">
            {t("patientProfile.medical.viewReports")}
          </PatientButton>
        </KneeGuideInsightCard>
      )}
    </div>
  );
};

export default ProfileMedicalTab;
