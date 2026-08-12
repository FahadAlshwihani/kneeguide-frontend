import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuTrash2 } from "react-icons/lu";
import DoctorModal from "./DoctorModal";
import { ALL_EXERCISES } from "../../../../../domain/rehab/demoData/exercises";
import { EXERCISE_MODE } from "../../../../../domain/rehab/rehabEnums";
import { rehabRepository } from "../../../../../domain/rehab/useRehabDomain";
import "./RehabilitationTab.css";

const emptyDraft = (exerciseId) => {
  const exercise = ALL_EXERCISES.find((item) => item.id === exerciseId) || ALL_EXERCISES[0];
  return {
    exerciseId: exercise.id,
    mode: exercise.mode,
    sets: 3,
    repsPerSet: 10,
    durationSeconds: 30,
    holdSeconds: "",
    frequencyPerWeek: 5,
    targetRomMin: "",
    targetRomMax: "",
    instructionsNote: "",
  };
};

/**
 * Rehabilitation tab (Section 14-16 of the Doctor Patients module brief):
 * shows the patient's ACTIVE prescriptions (real, from the shared rehab
 * domain), each with sets/reps-or-duration/frequency/target ROM/
 * adherence/last-completed — and a real "Edit rehabilitation plan"
 * workflow, drawing exercises from the SAME catalog the Patient side's
 * Exercise Library uses (Section 15: never a doctor-only exercise list).
 * Saving calls `rehabRepository.assignExercise`/`removePrescription`
 * directly, which is what makes the change visible on the Patient side
 * immediately (Section 17, Scenario A).
 */
const RehabilitationTab = ({ bundle }) => {
  const { t } = useTranslation();
  const { patient, activePrescriptions, sessions } = bundle;
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState(() => emptyDraft(ALL_EXERCISES[0].id));
  const [error, setError] = useState(null);

  const catalogById = useMemo(() => Object.fromEntries(ALL_EXERCISES.map((exercise) => [exercise.id, exercise])), []);
  const assignedIds = new Set(activePrescriptions.map((rx) => rx.exerciseId));
  const availableToAdd = ALL_EXERCISES.filter((exercise) => !assignedIds.has(exercise.id));

  const lastCompletedFor = (exerciseId) => {
    for (let i = sessions.length - 1; i >= 0; i -= 1) {
      if (sessions[i].exercises.some((exercise) => exercise.id === exerciseId)) return sessions[i].date;
    }
    return null;
  };

  const openEditor = () => {
    setDraft(emptyDraft(availableToAdd[0]?.id || ALL_EXERCISES[0].id));
    setError(null);
    setEditorOpen(true);
  };

  const handleExerciseChange = (exerciseId) => {
    const exercise = catalogById[exerciseId];
    setDraft((prev) => ({ ...prev, exerciseId, mode: exercise.mode }));
  };

  const handleAdd = () => {
    const sets = Number(draft.sets);
    const reps = Number(draft.repsPerSet);
    const duration = Number(draft.durationSeconds);
    const frequency = Number(draft.frequencyPerWeek);

    if (!Number.isInteger(sets) || sets <= 0) return setError(t("doctorPatientWorkspace.rehab.errors.sets"));
    if (draft.mode === EXERCISE_MODE.REPS && (!Number.isInteger(reps) || reps <= 0)) {
      return setError(t("doctorPatientWorkspace.rehab.errors.reps"));
    }
    if (draft.mode === EXERCISE_MODE.DURATION && (!Number.isInteger(duration) || duration <= 0)) {
      return setError(t("doctorPatientWorkspace.rehab.errors.duration"));
    }
    if (!Number.isInteger(frequency) || frequency < 1 || frequency > 7) {
      return setError(t("doctorPatientWorkspace.rehab.errors.frequency"));
    }

    rehabRepository.assignExercise(patient.id, {
      exerciseId: draft.exerciseId,
      mode: draft.mode,
      sets,
      repsPerSet: draft.mode === EXERCISE_MODE.REPS ? reps : null,
      durationSeconds: draft.mode === EXERCISE_MODE.DURATION ? duration : null,
      holdSeconds: draft.holdSeconds ? Number(draft.holdSeconds) : null,
      frequencyPerWeek: frequency,
      targetRomMin: draft.targetRomMin ? Number(draft.targetRomMin) : null,
      targetRomMax: draft.targetRomMax ? Number(draft.targetRomMax) : null,
      instructionsNote: draft.instructionsNote,
    });
    setError(null);
    setDraft(emptyDraft(availableToAdd.find((exercise) => exercise.id !== draft.exerciseId)?.id || ALL_EXERCISES[0].id));
  };

  const handleRemove = (prescriptionId) => {
    rehabRepository.removePrescription(prescriptionId);
  };

  return (
    <div>
      <section className="dw-section rt-plan-header">
        <div>
          <h2>{t("doctorPatientWorkspace.rehab.currentPlan")}</h2>
          <p className="rt-plan-meta">
            {t(`rehabDomain.phase.${patient.phaseKey}`)} ·{" "}
            {t("doctorPatientWorkspace.rehab.startDate", {
              date: new Date(patient.programStartDate).toLocaleDateString(),
            })}
          </p>
        </div>
        <button type="button" className="dw-btn-primary" onClick={openEditor}>
          {t("doctorPatientWorkspace.rehab.editPlan")}
        </button>
      </section>

      {activePrescriptions.length === 0 ? (
        <div className="dw-empty-state">{t("doctorPatientWorkspace.rehab.noExercises")}</div>
      ) : (
        <div className="rt-list">
          {activePrescriptions.map((rx) => {
            const exercise = catalogById[rx.exerciseId];
            const lastCompleted = lastCompletedFor(rx.exerciseId);
            return (
              <div key={rx.id} className="dw-section rt-card">
                <div className="rt-card-top">
                  <h3>{t(exercise.nameKey)}</h3>
                  <button
                    type="button"
                    className="dw-btn-secondary rt-remove-btn"
                    onClick={() => handleRemove(rx.id)}
                    aria-label={t("doctorPatientWorkspace.rehab.remove")}
                  >
                    <LuTrash2 aria-hidden="true" />
                  </button>
                </div>
                <p className="rt-prescription-line">
                  {rx.mode === EXERCISE_MODE.REPS
                    ? t("doctorPatientWorkspace.rehab.repsLine", { sets: rx.sets, reps: rx.repsPerSet })
                    : t("doctorPatientWorkspace.rehab.durationLine", { sets: rx.sets, seconds: rx.durationSeconds })}
                  {rx.holdSeconds ? ` · ${t("doctorPatientWorkspace.rehab.holdLine", { seconds: rx.holdSeconds })}` : ""}
                </p>
                <p className="rt-meta-line">{t("doctorPatientWorkspace.rehab.frequencyLine", { count: rx.frequencyPerWeek })}</p>
                {rx.targetRomMin !== null && (
                  <p className="rt-meta-line">
                    {t("doctorPatientWorkspace.rehab.targetRomLine", { min: rx.targetRomMin, max: rx.targetRomMax })}
                  </p>
                )}
                {rx.instructionsNote && <p className="rt-instructions">{rx.instructionsNote}</p>}
                <p className="rt-meta-line rt-last-completed">
                  {lastCompleted
                    ? t("doctorPatientWorkspace.rehab.lastCompleted", { date: new Date(lastCompleted).toLocaleDateString() })
                    : t("doctorPatientWorkspace.rehab.neverCompleted")}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <DoctorModal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={t("doctorPatientWorkspace.rehab.editPlan")}
        closeLabel={t("doctorPatientWorkspace.close")}
        footer={
          <>
            <button type="button" className="dw-btn-secondary" onClick={() => setEditorOpen(false)}>
              {t("doctorPatientWorkspace.done")}
            </button>
          </>
        }
      >
        <div className="rt-editor-current">
          <h4>{t("doctorPatientWorkspace.rehab.activeExercises")}</h4>
          {activePrescriptions.length === 0 ? (
            <p className="dw-empty-state">{t("doctorPatientWorkspace.rehab.noExercises")}</p>
          ) : (
            <ul className="rt-editor-current-list">
              {activePrescriptions.map((rx) => (
                <li key={rx.id}>
                  <span>{t(catalogById[rx.exerciseId].nameKey)}</span>
                  <button type="button" onClick={() => handleRemove(rx.id)} aria-label={t("doctorPatientWorkspace.rehab.remove")}>
                    <LuTrash2 aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {availableToAdd.length > 0 && (
          <div className="rt-editor-add">
            <h4>{t("doctorPatientWorkspace.rehab.addExercise")}</h4>

            <div className="dw-field">
              <label htmlFor="rt-exercise-select">{t("doctorPatientWorkspace.rehab.fields.exercise")}</label>
              <select id="rt-exercise-select" value={draft.exerciseId} onChange={(event) => handleExerciseChange(event.target.value)}>
                {availableToAdd.map((exercise) => (
                  <option key={exercise.id} value={exercise.id}>
                    {t(exercise.nameKey)}
                  </option>
                ))}
              </select>
            </div>

            <div className="dw-field-row">
              <div className="dw-field">
                <label htmlFor="rt-sets">{t("doctorPatientWorkspace.rehab.fields.sets")}</label>
                <input
                  id="rt-sets"
                  type="number"
                  min="1"
                  value={draft.sets}
                  onChange={(event) => setDraft((prev) => ({ ...prev, sets: event.target.value }))}
                />
              </div>

              {draft.mode === EXERCISE_MODE.REPS ? (
                <div className="dw-field">
                  <label htmlFor="rt-reps">{t("doctorPatientWorkspace.rehab.fields.reps")}</label>
                  <input
                    id="rt-reps"
                    type="number"
                    min="1"
                    value={draft.repsPerSet}
                    onChange={(event) => setDraft((prev) => ({ ...prev, repsPerSet: event.target.value }))}
                  />
                </div>
              ) : (
                <div className="dw-field">
                  <label htmlFor="rt-duration">{t("doctorPatientWorkspace.rehab.fields.durationSeconds")}</label>
                  <input
                    id="rt-duration"
                    type="number"
                    min="1"
                    value={draft.durationSeconds}
                    onChange={(event) => setDraft((prev) => ({ ...prev, durationSeconds: event.target.value }))}
                  />
                </div>
              )}

              <div className="dw-field">
                <label htmlFor="rt-frequency">{t("doctorPatientWorkspace.rehab.fields.frequency")}</label>
                <input
                  id="rt-frequency"
                  type="number"
                  min="1"
                  max="7"
                  value={draft.frequencyPerWeek}
                  onChange={(event) => setDraft((prev) => ({ ...prev, frequencyPerWeek: event.target.value }))}
                />
              </div>
            </div>

            <div className="dw-field-row">
              {draft.mode === EXERCISE_MODE.REPS && (
                <div className="dw-field">
                  <label htmlFor="rt-hold">{t("doctorPatientWorkspace.rehab.fields.holdSeconds")}</label>
                  <input
                    id="rt-hold"
                    type="number"
                    min="0"
                    value={draft.holdSeconds}
                    onChange={(event) => setDraft((prev) => ({ ...prev, holdSeconds: event.target.value }))}
                  />
                </div>
              )}
              <div className="dw-field">
                <label htmlFor="rt-rom-min">{t("doctorPatientWorkspace.rehab.fields.targetRomMin")}</label>
                <input
                  id="rt-rom-min"
                  type="number"
                  min="0"
                  value={draft.targetRomMin}
                  onChange={(event) => setDraft((prev) => ({ ...prev, targetRomMin: event.target.value }))}
                />
              </div>
              <div className="dw-field">
                <label htmlFor="rt-rom-max">{t("doctorPatientWorkspace.rehab.fields.targetRomMax")}</label>
                <input
                  id="rt-rom-max"
                  type="number"
                  min="0"
                  value={draft.targetRomMax}
                  onChange={(event) => setDraft((prev) => ({ ...prev, targetRomMax: event.target.value }))}
                />
              </div>
            </div>

            <div className="dw-field">
              <label htmlFor="rt-instructions">{t("doctorPatientWorkspace.rehab.fields.instructions")}</label>
              <textarea
                id="rt-instructions"
                rows={2}
                value={draft.instructionsNote}
                onChange={(event) => setDraft((prev) => ({ ...prev, instructionsNote: event.target.value }))}
              />
            </div>

            {error && <p className="dw-field-error">{error}</p>}

            <button type="button" className="dw-btn-primary" onClick={handleAdd}>
              {t("doctorPatientWorkspace.rehab.addToProgram")}
            </button>
          </div>
        )}
      </DoctorModal>
    </div>
  );
};

export default RehabilitationTab;
