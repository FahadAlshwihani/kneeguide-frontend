// src/pages/PatientExercises.jsx
import React, { useState } from "react";
import "../styles/PatientExercises.css";
import ExerciseCard from "../../shared/components/ExerciseCard";
import { useTranslation } from "react-i18next";

const PatientExercises = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState("today");
  const [activeExercise, setActiveExercise] = useState(null);

  // ================
  // MOCK DATA
  // ================
  const todayExercises = [
    {
      name: t("patientExercises.mock.quadSets.name"),
      reps: "3 × 12",
      lastDone: t("patientExercises.mock.quadSets.lastDone"),
      progress: 80,
      image:
        "https://twnlivestorage1.blob.core.windows.net/twn-media-public/KRM63451A/332192.jpg",
      video: "https://www.youtube.com/watch?v=5TUK4uT2nnw",
      description: t("patientExercises.mock.quadSets.description"),
    },
    {
      name: t("patientExercises.mock.legRaises.name"),
      reps: "3 × 10",
      lastDone: t("patientExercises.mock.legRaises.lastDone"),
      progress: 60,
      image:
        "https://twnlivestorage1.blob.core.windows.net/twn-media-public/KRM65842A/357653.jpg",
      video: "https://www.youtube.com/watch?v=gobteD5GWkE",
      description: t("patientExercises.mock.legRaises.description"),
    },
    {
      name: t("patientExercises.mock.heelSlides.name"),
      reps: "3 × 15",
      lastDone: t("patientExercises.mock.heelSlides.lastDone"),
      progress: 40,
      image:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQWc8NT1BKuYOP8r-UvfTw92P1US480dT5gBw&s",
      video: "https://www.youtube.com/watch?v=A7fcobCVppc",
      description: t("patientExercises.mock.heelSlides.description"),
    },
  ];

  const allExercises = [
    ...todayExercises,
    {
      name: t("patientExercises.mock.hamstring.name"),
      reps: "2 × 30 sec",
      lastDone: t("patientExercises.mock.hamstring.lastDone"),
      progress: 20,
      image:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT_giL-IUoN0K8-EHtvcebyA7xRdNdSXtK-HQ&s",
      video: "https://www.youtube.com/watch?v=me22JRV7pJc",
      description: t("patientExercises.mock.hamstring.description"),
    },
    {
      name: t("patientExercises.mock.calfRaises.name"),
      reps: "3 × 15",
      lastDone: t("patientExercises.mock.calfRaises.lastDone"),
      progress: 10,
      image:
        "https://gymgeek.com/wp-content/uploads/2023/10/raised-step-calf-raises-1.png",
      video: "https://www.youtube.com/watch?v=BxfKOyI8sUg",
      description: t("patientExercises.mock.calfRaises.description"),
    },
  ];

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
