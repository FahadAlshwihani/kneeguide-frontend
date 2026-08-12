import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDoctorProfile } from "../../../../../domain/rehab/useRehabDomain";
import { TREND_DIRECTION_I18N_KEY, ATTENTION_REASON_I18N_KEY } from "../../../../../domain/rehab/rehabEnums";
import "./OverviewTab.css";

const weekNumber = (programStartDate) => {
  const start = new Date(programStartDate);
  const diffDays = Math.floor((Date.now() - start.getTime()) / 86400000);
  return Math.max(1, Math.floor(diffDays / 7) + 1);
};

/** Merges sessions/pain logs/reports/appointments into one reverse-chronological activity feed (Section 11). */
const buildActivityFeed = (bundle) => {
  const events = [];
  bundle.sessions.forEach((session) =>
    events.push({ id: `session-${session.id}`, type: "sessionCompleted", date: session.completedAt || session.date, session })
  );
  bundle.reports.forEach((report) =>
    events.push({ id: `report-${report.id}`, type: "reportGenerated", date: report.generatedAt, report })
  );
  bundle.appointments.forEach((appt) =>
    events.push({ id: `appt-${appt.id}`, type: "appointmentRequested", date: appt.requestedAt, appointment: appt })
  );
  return events.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
};

const OverviewTab = ({ bundle }) => {
  const { t, i18n } = useTranslation();
  const { patient, adherence, priority, latestPain, latestRom, trendDirection, sessions } = bundle;
  const doctorProfile = useDoctorProfile();

  const activity = useMemo(() => buildActivityFeed(bundle), [bundle]);
  const week = useMemo(() => weekNumber(patient.programStartDate), [patient.programStartDate]);
  const latestSession = sessions[sessions.length - 1] || null;
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(i18n.language, { month: "short", day: "numeric" }), [i18n.language]);

  return (
    <div>
      <div className="dw-grid-3">
        <section className="dw-section">
          <h3>{t("doctorPatientWorkspace.overview.clinicalStatus")}</h3>
          <dl className="ov-facts">
            <div>
              <dt>{t("doctorPatientWorkspace.overview.diagnosis")}</dt>
              <dd>{t(patient.diagnosisKey)}</dd>
            </div>
            <div>
              <dt>{t("doctorPatientWorkspace.overview.phase")}</dt>
              <dd>{t(`rehabDomain.phase.${patient.phaseKey}`)}</dd>
            </div>
            <div>
              <dt>{t("doctorPatientWorkspace.overview.week")}</dt>
              <dd>{t("doctorPatientWorkspace.overview.weekValue", { number: week })}</dd>
            </div>
            <div>
              <dt>{t("doctorPatientWorkspace.overview.clinician")}</dt>
              <dd>{doctorProfile.name}</dd>
            </div>
          </dl>
        </section>

        <section className="dw-section">
          <h3>{t("doctorPatientWorkspace.overview.rehabProgress")}</h3>
          <dl className="ov-facts">
            <div>
              <dt>{t("doctorPatientWorkspace.overview.adherence")}</dt>
              <dd dir="ltr">{adherence.percent !== null ? `${adherence.percent}%` : "—"}</dd>
            </div>
            <div>
              <dt>{t("doctorPatientWorkspace.overview.sessionsThisWeek")}</dt>
              <dd dir="ltr">{`${adherence.completed} / ${adherence.expected}`}</dd>
            </div>
            <div>
              <dt>{t("doctorPatientWorkspace.overview.trend")}</dt>
              <dd className={`ov-trend ov-trend--${TREND_DIRECTION_I18N_KEY[trendDirection]}`}>
                {t(`rehabDomain.trend.${TREND_DIRECTION_I18N_KEY[trendDirection]}`)}
              </dd>
            </div>
          </dl>
        </section>

        <section className="dw-section">
          <h3>{t("doctorPatientWorkspace.overview.latestMeasurements")}</h3>
          <dl className="ov-facts">
            <div>
              <dt>{t("doctorPatientWorkspace.overview.pain")}</dt>
              <dd dir="ltr">{latestPain ? `${latestPain.value}/10` : "—"}</dd>
            </div>
            <div>
              <dt>{t("doctorPatientWorkspace.overview.flexionRom")}</dt>
              <dd dir="ltr">{latestRom !== null ? `${latestRom}°` : "—"}</dd>
            </div>
            <div>
              <dt>{t("doctorPatientWorkspace.overview.movementQuality")}</dt>
              <dd>
                {latestSession?.exercises?.length
                  ? t(`patientExercises.session.quality.${latestSession.exercises[0].qualityKey}`)
                  : "—"}
              </dd>
            </div>
          </dl>
          <p className="ov-visualization-note">{t("doctorPatientWorkspace.overview.romVisualizationNote")}</p>
        </section>
      </div>

      {priority.reasons.length > 0 && (
        <section className="dw-section ov-attention-section">
          <h3>{t("doctorPatientWorkspace.overview.whyFlagged")}</h3>
          <ul className="ov-reason-list">
            {priority.reasons.map((reason) => (
              <li key={reason.code}>{t(`rehabDomain.attentionReason.${ATTENTION_REASON_I18N_KEY[reason.code]}`)}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="dw-section">
        <h3>{t("doctorPatientWorkspace.overview.recentActivity")}</h3>
        {activity.length === 0 ? (
          <p className="dw-empty-state">{t("doctorPatientWorkspace.overview.noActivity")}</p>
        ) : (
          <ul className="ov-activity-list">
            {activity.map((event) => (
              <li key={event.id}>
                <span className="ov-activity-date">{dateFormatter.format(new Date(event.date))}</span>
                <span className="ov-activity-text">{t(`doctorPatientWorkspace.overview.activity.${event.type}`)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default OverviewTab;
