// src/pages/DoctorPatientProfile.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DoctorLayout from "../components/DoctorLayout";
import "../styles/DoctorPatientProfile.css";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
} from "chart.js";

import { ROUTES } from "../../../../utils/routes";
import KneeModelViewer from "../../../../components/three/KneeModelViewer";
import { useTranslation } from "react-i18next";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

// =======================
// Helpers
// =======================
const getInitials = (name) => {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

// =======================
// MOCK DATA
// =======================
const patient = {
  id: "PT-0003",
  name: "Ahmed Ali",
  age: 32,
  gender: "Male",
  email: "ahmed@example.com",
  phone: "0555555555",
  lastVisit: "2025-11-18",
  diagnosis: "ACL Partial Tear",
  risk: "medium",
  stage: "Rehab Phase 2",
  painLevel: 5,
};

const visits = [
  { date: "2025-11-18", type: "Follow-up", status: "Completed" },
  { date: "2025-11-10", type: "Initial Assessment", status: "Completed" },
  { date: "2025-11-03", type: "MRI Review", status: "Completed" },
];

const notes = [
  {
    id: "N-101",
    date: "2025-11-18",
    title: "Rehab session progress",
    content:
      "Patient shows improved range of motion. Continue strengthening exercises.",
  },
  {
    id: "N-100",
    date: "2025-11-10",
    title: "Initial Assessment Summary",
    content:
      "ACL Partial Tear confirmed. Assigned beginner-level exercises. Pain high.",
  },
];

const files = [
  { name: "MRI Scan.pdf", size: "1.2MB", date: "2025-11-03" },
  { name: "Initial Report.pdf", size: "600KB", date: "2025-11-10" },
];

const exercises = [
  { name: "Quad Sets", progress: 80 },
  { name: "Straight Leg Raises", progress: 60 },
  { name: "Heel Slides", progress: 40 },
];

const DoctorPatientProfile = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [selectedNote, setSelectedNote] = useState(null);
  const [showKneeInfo, setShowKneeInfo] = useState(false);

  // 🔹 بيانات نموذج الركبة (Mock)
  const kneeInfo = {
    currentAngle: 45,
    flexionRange: "0° → 120°",
    exercise: "Heel Slides",
    phase: "Mid-flexion",
    quality: "Good",
  };

  // 🔹 تقييم التمرين
  const [ratingExercise, setRatingExercise] = useState("Quad Sets");
  const [ratingScore, setRatingScore] = useState(8);
  const [ratingNote, setRatingNote] = useState("");

  const handleSaveRating = () => {
    console.log("Exercise rating saved:", {
      exercise: ratingExercise,
      score: ratingScore,
      note: ratingNote,
    });
    alert(t("doctorPatientProfile.feedback.saved"));
    setRatingNote("");
  };

  // Data for pain timeline chart (مع ترجمة لليبل)
  const painTimeline = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [
      {
        label: t("doctorPatientProfile.cards.pain.chartLabel"),
        data: [7, 6, 5, 4],
        borderColor: "#7d5bff",
        backgroundColor: "rgba(125, 91, 255, 0.15)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // أزرار الهيدر
  const handleNewReport = () => {
    navigate(ROUTES.DOCTOR_REPORTS);
  };

  const handleAssignExercises = () => {
    const el = document.getElementById("dpp-exercise-section");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleNewAppointment = () => {
    navigate(ROUTES.APPOINTMENTS);
  };

  // ترجمة الجنس
  const genderLabel =
    patient.gender === "Male"
      ? t("doctorPatientProfile.cards.basicInfo.male")
      : t("doctorPatientProfile.cards.basicInfo.female");

  const riskLabel = t(
    `doctorPatientProfile.cards.clinicalStatus.risk.${patient.risk}`
  );

  return (
    <DoctorLayout active="patients">
      <div className="dpp-page">
        {/* HEADER */}
        <div className="dpp-header">
          <div className="dpp-header-main">
            <div className="dpp-avatar-letters">
              {getInitials(patient.name)}
            </div>

            <div>
              <h1 className="dpp-name">{patient.name}</h1>
              <p className="dpp-subtext">
                {t("doctorPatientProfile.header.patientIdLabel")}{" "}
                <span>{patient.id}</span>
              </p>
            </div>
          </div>

          <div className="dpp-header-actions">
            <button className="dpp-primary-btn" onClick={handleNewReport}>
              {t("doctorPatientProfile.header.buttons.newReport")}
            </button>
            <button
              className="dpp-secondary-btn"
              onClick={handleAssignExercises}
            >
              {t("doctorPatientProfile.header.buttons.assignExercises")}
            </button>
            <button
              className="dpp-secondary-btn"
              onClick={handleNewAppointment}
            >
              {t("doctorPatientProfile.header.buttons.newAppointment")}
            </button>
          </div>
        </div>

        {/* OVERVIEW CARDS */}
        <div className="dpp-grid-3">
          {/* Basic Info */}
          <div className="dpp-card">
            <h3 className="dpp-card-title">
              {t("doctorPatientProfile.cards.basicInfo.title")}
            </h3>
            <ul className="dpp-info-list">
              <li>
                <span>{t("doctorPatientProfile.cards.basicInfo.age")}</span>
                <span>{patient.age}</span>
              </li>
              <li>
                <span>{t("doctorPatientProfile.cards.basicInfo.gender")}</span>
                <span>{genderLabel}</span>
              </li>
              <li>
                <span>{t("doctorPatientProfile.cards.basicInfo.phone")}</span>
                <span>{patient.phone}</span>
              </li>
              <li>
                <span>{t("doctorPatientProfile.cards.basicInfo.email")}</span>
                <span>{patient.email}</span>
              </li>
            </ul>
          </div>

          {/* Clinical Status */}
          <div className="dpp-card">
            <h3 className="dpp-card-title">
              {t("doctorPatientProfile.cards.clinicalStatus.title")}
            </h3>
            <ul className="dpp-info-list">
              <li>
                <span>
                  {t("doctorPatientProfile.cards.clinicalStatus.diagnosis")}
                </span>
                <span>{patient.diagnosis}</span>
              </li>
              <li>
                <span>
                  {t("doctorPatientProfile.cards.clinicalStatus.stage")}
                </span>
                <span>{patient.stage}</span>
              </li>
              <li>
                <span>
                  {t("doctorPatientProfile.cards.clinicalStatus.riskLevel")}
                </span>
                <span className={`risk-${patient.risk}`}>{riskLabel}</span>
              </li>
              <li>
                <span>
                  {t("doctorPatientProfile.cards.clinicalStatus.lastVisit")}
                </span>
                <span>{patient.lastVisit}</span>
              </li>
            </ul>
          </div>

          {/* Pain Level */}
          <div className="dpp-card">
            <h3 className="dpp-card-title">
              {t("doctorPatientProfile.cards.pain.title")}
            </h3>
            <div className="dpp-pain-bar">
              <div style={{ width: `${patient.painLevel * 10}%` }} />
            </div>
            <p className="dpp-pain-label">{patient.painLevel} / 10</p>

            <div style={{ marginTop: 10, fontSize: 12 }}>
              <span style={{ marginRight: 10 }}>
                <span style={{ color: "#22c55e", marginRight: 4 }}>●</span>
                {t("doctorPatientProfile.cards.pain.low")}
              </span>
              <span style={{ marginRight: 10 }}>
                <span style={{ color: "#eab308", marginRight: 4 }}>●</span>
                {t("doctorPatientProfile.cards.pain.medium")}
              </span>
              <span>
                <span style={{ color: "#ef4444", marginRight: 4 }}>●</span>
                {t("doctorPatientProfile.cards.pain.high")}
              </span>
            </div>
          </div>
        </div>

        {/* PAIN TIMELINE + 3D KNEE MODEL */}
        <div className="dpp-grid-2 dpp-top-visuals">
          <div className="dpp-card dpp-chart-card">
            <h3 className="dpp-card-title">
              {t("doctorPatientProfile.cards.pain.timelineTitle")}
            </h3>
            <Line data={painTimeline} height={80} />
          </div>

          <div className="dpp-card dpp-3d-card">
            <h3 className="dpp-card-title">
              {t("doctorPatientProfile.kneeModel.title")}
            </h3>
            <p className="dpp-subtext-small">
              {t("doctorPatientProfile.kneeModel.description")}
            </p>

            <KneeModelViewer
              activeExerciseKey="heelSlides"
              onClick={() => setShowKneeInfo((prev) => !prev)}
            />

            {showKneeInfo && (
              <div className="dpp-knee-info-box">
                <div className="dpp-knee-info-row">
                  <span>
                    {t("doctorPatientProfile.kneeModel.info.currentAngle")}
                  </span>
                  <strong>{kneeInfo.currentAngle}°</strong>
                </div>
                <div className="dpp-knee-info-row">
                  <span>
                    {t("doctorPatientProfile.kneeModel.info.exercise")}
                  </span>
                  <strong>{kneeInfo.exercise}</strong>
                </div>
                <div className="dpp-knee-info-row">
                  <span>
                    {t("doctorPatientProfile.kneeModel.info.flexionRange")}
                  </span>
                  <strong>{kneeInfo.flexionRange}</strong>
                </div>
                <div className="dpp-knee-info-row">
                  <span>{t("doctorPatientProfile.kneeModel.info.phase")}</span>
                  <strong>{kneeInfo.phase}</strong>
                </div>

                <div className="dpp-knee-legend">
                  <span>
                    <span
                      style={{
                        display: "inline-block",
                        width: 8,
                        height: 8,
                        borderRadius: "999px",
                        background: "#22c55e",
                        marginRight: 4,
                      }}
                    />
                    {t("doctorPatientProfile.kneeModel.legend.safe")}
                  </span>
                  <span>
                    <span
                      style={{
                        display: "inline-block",
                        width: 8,
                        height: 8,
                        borderRadius: "999px",
                        background: "#eab308",
                        marginRight: 4,
                      }}
                    />
                    {t("doctorPatientProfile.kneeModel.legend.caution")}
                  </span>
                  <span>
                    <span
                      style={{
                        display: "inline-block",
                        width: 8,
                        height: 8,
                        borderRadius: "999px",
                        background: "#ef4444",
                        marginRight: 4,
                      }}
                    />
                    {t("doctorPatientProfile.kneeModel.legend.highRisk")}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* NOTES + FILES */}
        <div className="dpp-grid-2">
          <div className="dpp-card dpp-notes-card">
            <h3 className="dpp-card-title">
              {t("doctorPatientProfile.sections.notes")}
            </h3>

            <div className="dpp-notes-list">
              {notes.map((n) => (
                <div
                  key={n.id}
                  className="dpp-note-row"
                  onClick={() => setSelectedNote(n)}
                >
                  <span className="dpp-note-title">{n.title}</span>
                  <span className="dpp-note-date">{n.date}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="dpp-card dpp-files-card">
            <h3 className="dpp-card-title">
              {t("doctorPatientProfile.sections.files")}
            </h3>

            <div className="dpp-files-list">
              {files.map((f, idx) => (
                <div key={idx} className="dpp-file-row">
                  <span>{f.name}</span>
                  <span className="dpp-file-meta">{f.size}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* EXERCISE PROGRAM + FEEDBACK */}
        <div className="dpp-grid-2">
          <div className="dpp-card" id="dpp-exercise-section">
            <h3 className="dpp-card-title">
              {t("doctorPatientProfile.sections.exerciseProgram")}
            </h3>

            <div className="dpp-exercise-list">
              {exercises.map((ex, idx) => (
                <div key={idx} className="dpp-exercise-row">
                  <span>{ex.name}</span>
                  <div className="dpp-ex-progress">
                    <div style={{ width: `${ex.progress}%` }} />
                  </div>
                  <span className="dpp-ex-percent">{ex.progress}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Exercise Feedback */}
          <div className="dpp-card">
            <h3 className="dpp-card-title">
              {t("doctorPatientProfile.sections.exerciseFeedback")}
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <label
                  style={{
                    fontSize: 13,
                    color: "#555",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  {t("doctorPatientProfile.feedback.labels.exercise")}
                </label>
                <select
                  value={ratingExercise}
                  onChange={(e) => setRatingExercise(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid #ddd",
                    fontSize: 14,
                  }}
                >
                  {exercises.map((ex, idx) => (
                    <option key={idx} value={ex.name}>
                      {ex.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    fontSize: 13,
                    color: "#555",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  {t("doctorPatientProfile.feedback.labels.rating")}
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={ratingScore}
                  onChange={(e) => setRatingScore(Number(e.target.value))}
                  style={{ width: "100%" }}
                />
                <div style={{ fontSize: 13, marginTop: 4 }}>
                  {t("doctorPatientProfile.feedback.labels.current")}{" "}
                  <strong>{ratingScore}/10</strong>
                </div>
              </div>

              <div>
                <label
                  style={{
                    fontSize: 13,
                    color: "#555",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  {t("doctorPatientProfile.feedback.labels.note")}
                </label>
                <textarea
                  rows={4}
                  value={ratingNote}
                  onChange={(e) => setRatingNote(e.target.value)}
                  placeholder={t("doctorPatientProfile.feedback.placeholder")}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid #ddd",
                    fontSize: 14,
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ marginTop: 8 }}>
                <button
                  type="button"
                  onClick={handleSaveRating}
                  className="dpp-primary-btn"
                >
                  {t("doctorPatientProfile.feedback.button")}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* VISITS */}
        <div className="dpp-card">
          <h3 className="dpp-card-title">
            {t("doctorPatientProfile.sections.visits")}
          </h3>

          <table className="dpp-visits-table">
            <thead>
              <tr>
                <th>
                  {t("doctorPatientProfile.visits.table.date")}
                </th>
                <th>
                  {t("doctorPatientProfile.visits.table.type")}
                </th>
                <th>
                  {t("doctorPatientProfile.visits.table.status")}
                </th>
              </tr>
            </thead>

            <tbody>
              {visits.map((v, idx) => (
                <tr key={idx}>
                  <td>{v.date}</td>
                  <td>{v.type}</td>
                  <td>
                    <span
                      className={`dpp-status dpp-status-${v.status.toLowerCase()}`}
                    >
                      {v.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* NOTE MODAL */}
        {selectedNote && (
          <div
            className="dpp-modal-backdrop"
            onClick={() => setSelectedNote(null)}
          >
            <div
              className="dpp-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <h2>{selectedNote.title}</h2>
              <p className="dpp-note-date">{selectedNote.date}</p>
              <p className="dpp-modal-body">{selectedNote.content}</p>

              <button
                className="dpp-close-btn"
                onClick={() => setSelectedNote(null)}
              >
                {t("doctorPatientProfile.modal.close")}
              </button>
            </div>
          </div>
        )}
      </div>
    </DoctorLayout>
  );
};

export default DoctorPatientProfile;
