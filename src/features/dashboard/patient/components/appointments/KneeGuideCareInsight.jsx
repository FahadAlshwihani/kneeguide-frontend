import React from "react";
import { useTranslation } from "react-i18next";
import KneeGuideInsightCard from "../exercises/KneeGuideInsightCard";
import PatientButton from "../PatientButton";

/**
 * "KneeGuide Care Insight" — ONE restrained, deterministic insight
 * (Section 32/33), built on the exact same KneeGuideInsightCard the
 * Exercise Session and Reports features already use — one visual
 * identity for "KneeGuide is telling you something," not a third bespoke
 * card style. `insight` is pre-computed by
 * appointments/patientAppointmentInsights.js's `getCareInsight` — this
 * component never decides which insight applies, it only renders the one
 * it's given. Deliberately distinct from `DoctorFeedback`
 * (components/reports/DoctorFeedback.jsx) both visually (Orb vs. plain
 * avatar) and conceptually (Section 42): this is KneeGuide's own
 * observation, never presented as something the clinician said.
 */
const KneeGuideCareInsight = ({ insight, onRequestClick, onViewAppointment }) => {
  const { t } = useTranslation();

  if (!insight) return null;

  const resolvedValues = insight.followUpKey ? { ...insight.values, followUp: t(insight.followUpKey) } : insight.values;

  return (
    <section aria-label={t("patientAppointments.insight.title")}>
      <KneeGuideInsightCard title={t("patientAppointments.insight.title")} message={t(insight.messageKey, resolvedValues)} tone="neutral">
        {insight.showRequestCta && (
          <PatientButton type="button" variant="primary" size="sm" onClick={onRequestClick}>
            {t("patientAppointments.request.cta")}
          </PatientButton>
        )}
        {!insight.showRequestCta && insight.appointmentId && (
          <PatientButton type="button" variant="ghost" size="sm" onClick={() => onViewAppointment(insight.appointmentId)}>
            {t("patientAppointments.viewDetails")}
          </PatientButton>
        )}
      </KneeGuideInsightCard>
    </section>
  );
};

export default KneeGuideCareInsight;
