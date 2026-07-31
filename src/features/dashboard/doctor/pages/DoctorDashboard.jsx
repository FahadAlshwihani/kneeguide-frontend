// src/pages/DoctorDashboard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import DoctorLayout from "../components/DoctorLayout";
import AvatarLetters from "../../../../components/common/AvatarLetters";
import "../styles/DoctorDashboard.css";

import { ROUTES } from "../../../../utils/routes";
import { Line } from "react-chartjs-2";

import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
} from "chart.js";

import { useTranslation } from "react-i18next";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const stats = {
    patients: 42,
    todayAppointments: 7,
    newReports: 4,
  };

  const appointments = [
    { name: "Ahmed Ali", date: "Today 4:30 PM", condition: "Knee Pain" },
    { name: "Sara Almutairi", date: "Today 3:10 PM", condition: "ACL Injury" },
    { name: "Mohammed Aziz", date: "Yesterday", condition: "Rehab Follow-up" },
    { name: "Lama Khaled", date: "Yesterday", condition: "Patella Issue" },
  ];

  const patients = [
    { name: "Ahmed Ali", lastVisit: "2 days ago" },
    { name: "Sara Almutairi", lastVisit: "1 week ago" },
    { name: "Fahad Alotaibi", lastVisit: "4 days ago" },
    { name: "Ruba Salem", lastVisit: "6 days ago" },
  ];

  const chartData = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [
      {
        label: "Average Patient Improvement",
        data: [20, 40, 55, 78],
        borderColor: "#7d5bff",
        backgroundColor: "rgba(125, 91, 255, 0.15)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const formattedDate = new Date().toLocaleDateString(
    i18n.language === "ar" ? "ar-SA" : "en-US",
    {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );

  return (
    <DoctorLayout active="dashboard">
      <div className="doctor-dashboard">

        {/* HEADER */}
        <div className="dash-header">
          <div>
            <h1>{t("doctorDashboard.header.title")}</h1>
            <p>{formattedDate}</p>
          </div>

          {/* QUICK ACTION BUTTONS */}
          <div className="quick-actions">
            <button
              className="qa-btn"
              onClick={() => navigate(ROUTES.APPOINTMENTS)}
            >
              {t("doctorDashboard.actions.newAppointment")}
            </button>

            <button
              className="qa-btn"
              onClick={() => navigate(ROUTES.DOCTOR_REPORTS)}
            >
              {t("doctorDashboard.actions.newReport")}
            </button>

            <button
              className="qa-btn"
              onClick={() => navigate(ROUTES.DOCTOR_PATIENTS)}
            >
              {t("doctorDashboard.actions.viewPatients")}
            </button>
          </div>
        </div>

        {/* STAT CARDS */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>{stats.patients}</h3>
            <p>{t("doctorDashboard.stats.activePatients")}</p>
          </div>

          <div className="stat-card">
            <h3>{stats.todayAppointments}</h3>
            <p>{t("doctorDashboard.stats.todayAppointments")}</p>
          </div>

          <div className="stat-card">
            <h3>{stats.newReports}</h3>
            <p>{t("doctorDashboard.stats.newReports")}</p>
          </div>
        </div>

        {/* CHART */}
        <div className="chart-card">
          <h2>{t("doctorDashboard.chart.title")}</h2>
          <Line data={chartData} height={80} />
        </div>

        {/* LOWER GRID */}
        <div className="dashboard-lower">

          {/* APPOINTMENTS */}
          <div className="appointments-card">
            <h2>{t("doctorDashboard.appointments.title")}</h2>

            <table>
              <thead>
                <tr>
                  <th>{t("doctorDashboard.appointments.columns.patient")}</th>
                  <th>{t("doctorDashboard.appointments.columns.condition")}</th>
                  <th>{t("doctorDashboard.appointments.columns.date")}</th>
                </tr>
              </thead>

              <tbody>
                {appointments.map((a, index) => (
                  <tr key={index}>
                    <td>
                      <div className="patient-with-img">
                        <AvatarLetters name={a.name} size={32} />
                        {a.name}
                      </div>
                    </td>
                    <td>{a.condition}</td>
                    <td className="date-cell">{a.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PATIENT LIST */}
          <div className="quick-patients-card">
            <h2>{t("doctorDashboard.patients.title")}</h2>

            {patients.map((p, index) => (
              <div key={index} className="quick-patient">
                <div className="patient-with-img">
                  <AvatarLetters name={p.name} size={32} />
                  <div>
                    <strong>{p.name}</strong>
                    <p className="last-visit">
                      {t("doctorDashboard.patients.lastVisitLabel")}{" "}
                      {p.lastVisit}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </DoctorLayout>
  );
};

export default DoctorDashboard;
