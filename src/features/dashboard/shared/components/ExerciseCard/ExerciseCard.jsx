import React from "react";
import { handlePreviewInteraction } from "../../previewInteraction";
import "./ExerciseCard.css";

/**
 * Extracted from PatientExercises's `.pe-card` list item. Presentational
 * only: the parent owns the exercise list and the video-modal behavior.
 *
 * previewMode: when true, the Start button performs no action (safe for
 * the public Hero) and picks up a "platform preview" aria-label.
 */
const ExerciseCard = ({
  name,
  reps,
  lastDoneLabel,
  lastDone,
  progress,
  image,
  startLabel,
  onStart,
  previewMode = false,
  className = "",
}) => {
  return (
    <div className={`exercise-card-root ${className}`.trim()}>
      {image && <img src={image} alt="" className="exercise-card-image" />}

      <div className="exercise-card-body">
        <h3 className="exercise-card-name">{name}</h3>
        <p className="exercise-card-meta">{reps}</p>
        {lastDone && (
          <p className="exercise-card-last">
            {lastDoneLabel}: {lastDone}
          </p>
        )}

        {typeof progress === "number" && (
          <div className="exercise-card-progress">
            <div className="exercise-card-progress-inner" style={{ width: `${progress}%` }} />
          </div>
        )}

        {startLabel && (
          <button
            type="button"
            className="exercise-card-start-btn"
            onClick={previewMode ? handlePreviewInteraction : onStart}
            aria-label={previewMode ? `${startLabel} — platform preview` : undefined}
          >
            {startLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default ExerciseCard;
