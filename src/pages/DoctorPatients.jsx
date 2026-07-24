import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DoctorLayout from "../components/layout/DoctorLayout";
import { ROUTES } from "../utils/routes";
import "../styles/DoctorPatients.css";
import { useTranslation } from "react-i18next";

const DoctorPatients = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  // 🔹 Mock data
  const patients = [
    {
      id: 1,
      name: "Ahmed Ali",
      age: 32,
      email: "john@example.com",
      phone: "0555555555",
      lastVisit: "2025-01-12",
      progress: 74,
      risk: "medium",
    },
    {
      id: 2,
      name: "Mohammed yuesf",
      age: 28,
      email: "sarah@example.com",
      phone: "0542222222",
      lastVisit: "2025-02-02",
      progress: 82,
      risk: "low",
    },
    {
      id: 3,
      name: "Sara Ahmed",
      age: 40,
      email: "michael@example.com",
      phone: "0568888888",
      lastVisit: "2025-01-21",
      progress: 51,
      risk: "high",
    },
  ];

  // 🔍 Filter
  const filtered = useMemo(() => {
    return patients.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  return (
    <DoctorLayout active="patients">
      <div className="dp-page">

        {/* HEADER */}
        <div className="dp-header">
          <div>
            <h1>{t("doctorPatients.title")}</h1>
            <p>{t("doctorPatients.subtitle")}</p>
          </div>

          <div className="dp-count-box">
            <span className="dp-count-pill">
              {t("doctorPatients.total")}: {patients.length}
            </span>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="dp-search-box">
          <input
            type="text"
            placeholder={t("doctorPatients.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* PATIENT CARDS */}
        <div className="dp-grid">
          {filtered.map((p) => (
            <div key={p.id} className="dp-card">

              {/* Top Section */}
              <div className="dp-card-top">
                <div>
                  <h3 className="dp-name">{p.name}</h3>
                  <p className="dp-id">
                    {t("doctorPatients.id")}: PT-{String(p.id).padStart(4, "0")}
                  </p>
                </div>

                <span className={`dp-risk dp-risk-${p.risk}`}>
                  {t(`doctorPatients.risk.${p.risk}`)}
                </span>
              </div>

              {/* Info Section */}
              <div className="dp-info">
                <p><strong>{t("doctorPatients.age")}:</strong> {p.age}</p>
                <p><strong>{t("doctorPatients.email")}:</strong> {p.email}</p>
                <p><strong>{t("doctorPatients.phone")}:</strong> {p.phone}</p>
                <p><strong>{t("doctorPatients.lastVisit")}:</strong> {p.lastVisit}</p>
              </div>

              {/* Progress */}
              <div className="dp-progress">
                <div className="dp-progress-bar">
                  <div style={{ width: `${p.progress}%` }}></div>
                </div>
                <p className="dp-progress-label">
                  {p.progress}% {t("doctorPatients.recovery")}
                </p>
              </div>

              {/* Actions */}
              <div className="dp-actions">

                <button
                  className="dp-btn-primary"
                  onClick={() => navigate(`/doctor/patient/${p.id}`)}
                >
                  {t("doctorPatients.actions.profile")}
                </button>

                <button
                  className="dp-btn-secondary"
                  onClick={() => navigate(`/doctor/patient/${p.id}/reports`)}
                >
                  {t("doctorPatients.actions.reports")}
                </button>

                <button
                  className="dp-btn-secondary"
                  onClick={() => navigate(`/doctor/patient/${p.id}/exercises`)}
                >
                  {t("doctorPatients.actions.exercises")}
                </button>

                <button
                  className="dp-btn-secondary"
                  onClick={() =>
                    navigate(`/doctor/patient/${p.id}/new-appointment`)
                  }
                >
                  {t("doctorPatients.actions.newAppointment")}
                </button>

              </div>

            </div>
          ))}
        </div>
      </div>
    </DoctorLayout>
  );
};

export default DoctorPatients;
