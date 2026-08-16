import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import PatientDialog, { PatientDialogCloseButton } from "../PatientDialog";
import "./ExerciseDetailsModal.css";

/**
 * Instructional media — reuses the exact same exercise `video`/`image`
 * fields the old catalog video modal used (patientExercisesData.js was
 * NOT extended with a new "media" shape for this; audited first, see the
 * final report). A YouTube URL embeds exactly as before (no `autoplay`
 * param — playback stays user-initiated, Section 6); no video falls back
 * to the image; neither falls back to a short, honest "not available"
 * message instead of a broken-image icon (Section 25).
 */
const ExerciseDetailsMedia = ({ video, image, name, t }) => {
  const [imageFailed, setImageFailed] = useState(false);

  if (video) {
    return (
      <div className="exercise-details-media">
        <iframe src={video.replace("watch?v=", "embed/")} title={name} allowFullScreen />
      </div>
    );
  }

  if (image && !imageFailed) {
    return (
      <div className="exercise-details-media exercise-details-media--image">
        <img src={image} alt="" onError={() => setImageFailed(true)} />
      </div>
    );
  }

  return (
    <div className="exercise-details-media exercise-details-media--empty">
      <p>{t("patientExercises.session.details.mediaUnavailable")}</p>
    </div>
  );
};

/**
 * The canonical instructional presentation of ONE exercise — video,
 * prescription, purpose, how-to steps, key cues, and a "watch for"
 * section, opened via the small ⓘ control (ExerciseInfoButton) from
 * anywhere an exercise appears: a session row (upcoming/active/
 * completed) or an Exercise Library row. Same component, same content,
 * either way — no separate library-specific detail view.
 *
 * Content comes from the exercise CATALOG (patientExercisesData.js) —
 * this component only renders whatever view-model PatientExercises.jsx
 * already assembled (`exercise` prop below); it has no data-fetching or
 * business logic of its own. `todaysTargetRange`/`prescriptionLabel` are
 * the only two fields that can be absent (Library context has no
 * session-specific prescription) — everything else always renders from
 * the exercise definition itself.
 *
 * Opening/closing this is pure UI state — it never touches
 * patientSessionEngine.js. The session/exercise timers this might be
 * opened over keep running exactly as before (Section 9): timers are
 * timestamp-derived, not paused by anything in this component.
 */
const ExerciseDetailsModal = ({ isOpen, onClose, exercise }) => {
  const { t } = useTranslation();

  if (!exercise) return null;

  return (
    <PatientDialog
      isOpen={isOpen}
      onClose={onClose}
      ariaLabelledBy="exercise-details-title"
      panelClassName="exercise-details-panel"
    >
      <div className="exercise-details-header">
        <div className="exercise-details-header-text">
          <p className="exercise-details-eyebrow">{t("patientExercises.session.details.title")}</p>
          <h2 id="exercise-details-title" className="exercise-details-title" dir="auto">
            {exercise.name}
          </h2>
          {exercise.target && (
            <p className="exercise-details-target" dir="auto">
              {exercise.target}
            </p>
          )}
        </div>
        <PatientDialogCloseButton onClose={onClose} label={t("patientExercises.session.close")} />
      </div>

      <ExerciseDetailsMedia video={exercise.video} image={exercise.image} name={exercise.name} t={t} />

      {exercise.prescriptionLabel && (
        <section className="exercise-details-section">
          <h3>{t("patientExercises.session.details.todaysPrescription")}</h3>
          <p dir="ltr">{exercise.prescriptionLabel}</p>
        </section>
      )}

      {exercise.purpose && (
        <section className="exercise-details-section">
          <h3>{t("patientExercises.session.details.purpose")}</h3>
          <p dir="auto">{exercise.purpose}</p>
        </section>
      )}

      {Array.isArray(exercise.instructions) && exercise.instructions.length > 0 && (
        <section className="exercise-details-section">
          <h3>{t("patientExercises.session.details.howToPerform")}</h3>
          <ol className="exercise-details-list exercise-details-list--numbered">
            {exercise.instructions.map((step, index) => (
              <li key={index} dir="auto">
                {step}
              </li>
            ))}
          </ol>
        </section>
      )}

      {Array.isArray(exercise.cues) && exercise.cues.length > 0 && (
        <section className="exercise-details-section">
          <h3>{t("patientExercises.session.details.keyCues")}</h3>
          <ul className="exercise-details-list">
            {exercise.cues.map((cue, index) => (
              <li key={index} dir="auto">
                {cue}
              </li>
            ))}
          </ul>
        </section>
      )}

      {Array.isArray(exercise.mistakes) && exercise.mistakes.length > 0 && (
        <section className="exercise-details-section">
          <h3>{t("patientExercises.session.details.watchFor")}</h3>
          <ul className="exercise-details-list">
            {exercise.mistakes.map((mistake, index) => (
              <li key={index} dir="auto">
                {mistake}
              </li>
            ))}
          </ul>
        </section>
      )}

      {exercise.todaysTargetRange && (
        <div className="exercise-details-tip">
          <p className="exercise-details-tip-title">{t("patientExercises.session.details.kneeGuideTip")}</p>
          <p dir="auto">
            {t("patientExercises.session.details.kneeGuideTipMessage", {
              min: exercise.todaysTargetRange.min,
              max: exercise.todaysTargetRange.max,
            })}
          </p>
        </div>
      )}
    </PatientDialog>
  );
};

export default ExerciseDetailsModal;
