import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import DoctorModal from "./DoctorModal";
import { ALL_EXERCISES } from "../../../../../domain/rehab/demoData/exercises";
import { rehabRepository } from "../../../../../domain/rehab/useRehabDomain";
import { sessionAverageRom } from "../../../../../domain/rehab/rehabDerived";
import "./SessionsTab.css";

/**
 * Sessions tab (Section 20-21) — real rehabilitation session history from
 * the shared domain, newest first. Opening a session shows the prescribed
 * vs. completed breakdown and measurements (READ-ONLY — the doctor can
 * add a note and mark it reviewed, never edit the sensor/session values
 * themselves, per Section 20's "Doctor should NOT modify raw sensor
 * measurements").
 */
const SessionsTab = ({ bundle }) => {
  const { t, i18n } = useTranslation();
  const { patient, sessions } = bundle;
  const [selectedId, setSelectedId] = useState(null);
  const [note, setNote] = useState("");

  const catalogById = useMemo(() => Object.fromEntries(ALL_EXERCISES.map((exercise) => [exercise.id, exercise])), []);
  const ordered = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));
  const selected = ordered.find((session) => session.id === selectedId) || null;
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { month: "short", day: "numeric", year: "numeric" }),
    [i18n.language]
  );

  const openSession = (session) => {
    setSelectedId(session.id);
    setNote("");
  };

  const handleMarkReviewed = () => {
    if (!selected) return;
    let noteId = null;
    if (note.trim()) {
      const created = rehabRepository.addClinicalNote(patient.id, {
        authorId: patient.clinicianId,
        typeKey: "rehabDomain.noteTypes.sessionProgress",
        content: note.trim(),
        sessionId: selected.id,
      });
      noteId = created.id;
    }
    rehabRepository.markSessionReviewed(selected.id, { reviewed: true, doctorNoteId: noteId });
    setSelectedId(null);
  };

  return (
    <div>
      {ordered.length === 0 ? (
        <div className="dw-empty-state">{t("doctorPatientWorkspace.sessions.empty")}</div>
      ) : (
        <div className="st-table-wrap">
          <table className="st-table">
            <thead>
              <tr>
                <th>{t("doctorPatientWorkspace.sessions.table.date")}</th>
                <th>{t("doctorPatientWorkspace.sessions.table.completion")}</th>
                <th>{t("doctorPatientWorkspace.sessions.table.pain")}</th>
                <th>{t("doctorPatientWorkspace.sessions.table.rom")}</th>
                <th>{t("doctorPatientWorkspace.sessions.table.review")}</th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((session) => {
                const completed = session.exercises.filter((exercise) => exercise.completedSets >= exercise.totalSets).length;
                return (
                  <tr
                    key={session.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openSession(session)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openSession(session);
                      }
                    }}
                  >
                    <td>{dateFormatter.format(new Date(session.date))}</td>
                    <td>
                      {completed}/{session.exercises.length}
                    </td>
                    <td dir="ltr">
                      {session.painBefore ?? "—"} → {session.painAfter ?? "—"}
                    </td>
                    <td dir="ltr">{sessionAverageRom(session) ?? "—"}°</td>
                    <td>
                      <span className={`st-review-pill ${session.reviewed ? "reviewed" : "pending"}`}>
                        {t(session.reviewed ? "doctorPatientWorkspace.sessions.reviewed" : "doctorPatientWorkspace.sessions.awaitingReview")}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <DoctorModal
        isOpen={!!selected}
        onClose={() => setSelectedId(null)}
        title={selected ? dateFormatter.format(new Date(selected.date)) : ""}
        closeLabel={t("doctorPatientWorkspace.close")}
        footer={
          selected && (
            <>
              <button type="button" className="dw-btn-secondary" onClick={() => setSelectedId(null)}>
                {t("doctorPatientWorkspace.done")}
              </button>
              {!selected.reviewed && (
                <button type="button" className="dw-btn-primary" onClick={handleMarkReviewed}>
                  {t("doctorPatientWorkspace.sessions.markReviewed")}
                </button>
              )}
            </>
          )
        }
      >
        {selected && (
          <div className="st-detail">
            <div className="st-detail-summary">
              <div>
                <span className="st-detail-label">{t("doctorPatientWorkspace.sessions.table.pain")}</span>
                <span className="st-detail-value" dir="ltr">
                  {selected.painBefore ?? "—"} → {selected.painAfter ?? "—"}
                </span>
              </div>
              <div>
                <span className="st-detail-label">{t("doctorPatientWorkspace.sessions.table.rom")}</span>
                <span className="st-detail-value" dir="ltr">
                  {sessionAverageRom(selected) ?? "—"}°
                </span>
              </div>
              <div>
                <span className="st-detail-label">{t("doctorPatientWorkspace.sessions.source")}</span>
                <span className="st-detail-value">
                  {t(selected.source === "patient_app" ? "doctorPatientWorkspace.sessions.sourceLive" : "doctorPatientWorkspace.sessions.sourceHistorical")}
                </span>
              </div>
            </div>

            <h4 className="st-detail-heading">{t("doctorPatientWorkspace.sessions.exerciseBreakdown")}</h4>
            <ul className="st-exercise-list">
              {selected.exercises.map((exercise) => (
                <li key={exercise.id}>
                  <span>{t(catalogById[exercise.id]?.nameKey || exercise.id)}</span>
                  <span dir="ltr">
                    {exercise.completedSets}/{exercise.totalSets} · {exercise.rom !== null ? `${exercise.rom}°` : "—"} ·{" "}
                    {t(`patientExercises.session.quality.${exercise.qualityKey}`)}
                  </span>
                </li>
              ))}
            </ul>

            {!selected.reviewed && (
              <div className="dw-field">
                <label htmlFor="st-note">{t("doctorPatientWorkspace.sessions.addNote")}</label>
                <textarea id="st-note" rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
              </div>
            )}
          </div>
        )}
      </DoctorModal>
    </div>
  );
};

export default SessionsTab;
