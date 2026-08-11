// src/pages/PatientExercises.jsx
import React, { useState } from "react";
import "../styles/PatientExercises.css";
import ExerciseCard from "../../shared/components/ExerciseCard";
import { useTranslation } from "react-i18next";
import { TODAY_EXERCISES, ALL_EXERCISES } from "../data/patientExercisesData";

// Resolves the shared (key-based, translation-agnostic) exercise data
// module into the display-ready shape this page renders — the KneeGuide
// Assistant resolves the exact same TODAY_EXERCISES entries the same way
// (via its own fixed-language `t()` call) in patientAssistantActions.js,
// so both surfaces show identical exercise names/reps, never two lists
// that could drift apart.
const resolveExercise = (t, exercise) => ({
  name: t(exercise.nameKey),
  reps: exercise.reps,
  lastDone: t(exercise.lastDoneKey),
  progress: exercise.progress,
  image: exercise.image,
  video: exercise.video,
  description: t(exercise.descriptionKey),
});

const PatientExercises = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState("today");
  const [activeExercise, setActiveExercise] = useState(null);

  const todayExercises = TODAY_EXERCISES.map((exercise) => resolveExercise(t, exercise));
  const allExercises = ALL_EXERCISES.map((exercise) => resolveExercise(t, exercise));

  const list = filter === "today" ? todayExercises : allExercises;

  return (
    <div className="pe-page">
      <div className="pe-inner">

        {/* HEADER */}
        <header className="pe-header">
          <h1 className="pe-title">{t("patientExercises.header.title")}</h1>
          <p className="pe-subtitle">
            {t("patientExercises.header.subtitle")}
          </p>
        </header>

        {/* FILTER TABS */}
        <div className="pe-tabs">
          <button
            className={`pe-tab ${filter === "today" ? "active" : ""}`}
            onClick={() => setFilter("today")}
          >
            {t("patientExercises.tabs.today")}
          </button>

          <button
            className={`pe-tab ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            {t("patientExercises.tabs.all")}
          </button>
        </div>

        {/* EXERCISE LIST */}
        <div className="pe-list">
          {list.map((ex, idx) => (
            <ExerciseCard
              key={idx}
              name={ex.name}
              reps={ex.reps}
              lastDoneLabel={t("patientExercises.labels.lastDone")}
              lastDone={ex.lastDone}
              progress={ex.progress}
              image={ex.image}
              startLabel={t("patientExercises.buttons.start")}
              onStart={() => setActiveExercise(ex)}
            />
          ))}
        </div>

        {/* MODAL (exercise video) */}
        {activeExercise && (
          <div
            className="pe-modal-backdrop"
            onClick={() => setActiveExercise(null)}
          >
            <div
              className="pe-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="pe-modal-title">{activeExercise.name}</h2>

              <div className="pe-video-wrapper">
                <iframe
                  src={activeExercise.video.replace("watch?v=", "embed/")}
                  title="Exercise Video"
                  allowFullScreen
                />
              </div>

              <p className="pe-modal-text">{activeExercise.description}</p>

              <button
                className="pe-close-btn"
                onClick={() => setActiveExercise(null)}
              >
                {t("patientExercises.buttons.close")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientExercises;
