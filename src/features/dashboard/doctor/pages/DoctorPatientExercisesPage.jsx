// src/pages/DoctorPatientExercisesPage.jsx
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import DoctorLayout from "../components/DoctorLayout";
import "../styles/DoctorReports.css";

import { useTranslation } from "react-i18next";

const mockExercises = [
  { name: "Quad Sets", progress: 80, difficulty: "Medium" },
  { name: "Heel Slides", progress: 60, difficulty: "Easy" },
  { name: "Straight Leg Raise", progress: 40, difficulty: "Hard" },
];

const DoctorPatientExercisesPage = () => {
  const { id } = useParams();
  const [list] = useState(mockExercises);
  const { t } = useTranslation();

  return (
    <DoctorLayout active="patients">
      <div className="reports-page">
        <div className="reports-wrapper">

          {/* HEADER */}
          <div className="reports-header">
            <h1>{t("doctorExercises.header.title")}</h1>
            <p>
              {t("doctorExercises.header.subtitle")} {id}
            </p>
          </div>

          {/* MAIN CONTENT */}
          <div className="reports-main">
            <div className="reports-table-card">
              <div className="card-header">
                <h2>{t("doctorExercises.table.title")}</h2>
                <p>{t("doctorExercises.table.subtitle")}</p>
              </div>

              <div className="table-wrapper">
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>{t("doctorExercises.columns.exercise")}</th>
                      <th>{t("doctorExercises.columns.progress")}</th>
                      <th>{t("doctorExercises.columns.difficulty")}</th>
                    </tr>
                  </thead>

                  <tbody>
                    {list.map((ex, idx) => (
                      <tr key={idx}>
                        <td>{ex.name}</td>
                        <td>
                          <span className="pill pill-complete">
                            {ex.progress}%
                          </span>
                        </td>
                        <td>{ex.difficulty}</td>
                      </tr>
                    ))}
                  </tbody>

                </table>
              </div>
            </div>
          </div>

        </div>
      </div>
    </DoctorLayout>
  );
};

export default DoctorPatientExercisesPage;
