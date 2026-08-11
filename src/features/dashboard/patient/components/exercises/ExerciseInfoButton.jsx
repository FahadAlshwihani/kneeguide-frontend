import React from "react";
import { useTranslation } from "react-i18next";
import { LuInfo } from "react-icons/lu";
import "./ExerciseInfoButton.css";

/**
 * The small "ⓘ" affordance beside an exercise name — the ONE place a
 * patient opens Exercise Details from, whether that exercise is
 * upcoming, active, completed, or just a Library reference row (Section
 * 1/17/18/19). Deliberately its own tiny button, never the whole
 * row/card made clickable (Section 2) — this keeps it unambiguous from
 * the active exercise's own controls (Complete Set, etc.).
 */
const ExerciseInfoButton = ({ exerciseName, onClick }) => {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      className="exercise-info-button"
      onClick={onClick}
      aria-label={t("patientExercises.session.details.viewInstructionsFor", { name: exerciseName })}
    >
      <LuInfo aria-hidden="true" />
    </button>
  );
};

export default ExerciseInfoButton;
