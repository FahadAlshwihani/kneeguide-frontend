// src/components/patient/PatientBottomNav.jsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../styles/PatientBottomNav.css";
import { ROUTES } from "../../utils/routes";
import { useTranslation } from "react-i18next";

// 👇 NEW IMPORT
import SidebarLanguageToggle from "../common/SidebarLanguageSwitcher";

const PatientBottomNav = ({ active }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const currentPath = location.pathname;

  const isActive = (key, pathStartsWith) => {
    if (active === key) return true;
    if (pathStartsWith && currentPath.startsWith(pathStartsWith)) return true;
    return false;
  };

  return (
    <nav className="pbn-wrapper">
      <div className="pbn-inner">

        {/* HOME */}
        <button
          className={`pbn-item ${
            isActive("home", "/patient/dashboard") ? "active" : ""
          }`}
          onClick={() => navigate(ROUTES.PATIENT_DASHBOARD)}
        >
          <span className="pbn-icon">🏠</span>
          <span className="pbn-label">{t("patientBottomNav.home")}</span>
        </button>

        {/* EXERCISES */}
        <button
          className={`pbn-item ${
            isActive("exercises", "/patient/exercises") ? "active" : ""
          }`}
          onClick={() => navigate(ROUTES.PATIENT_EXERCISES)}
        >
          <span className="pbn-icon">🦵</span>
          <span className="pbn-label">{t("patientBottomNav.exercises")}</span>
        </button>

        {/* 🔥 LANGUAGE TOGGLE (modern) */}
        <div className="pbn-lang-toggle">
          <SidebarLanguageToggle />
        </div>

        {/* REPORTS */}
        <button
          className={`pbn-item ${
            isActive("reports", "/patient/reports") ? "active" : ""
          }`}
          onClick={() => navigate(ROUTES.PATIENT_REPORTS)}
        >
          <span className="pbn-icon">📄</span>
          <span className="pbn-label">{t("patientBottomNav.reports")}</span>
        </button>

        {/* PROFILE */}
        <button
          className={`pbn-item ${
            isActive("profile", "/patient/profile") ? "active" : ""
          }`}
          onClick={() => navigate("/patient/profile")}
        >
          <span className="pbn-icon">👤</span>
          <span className="pbn-label">{t("patientBottomNav.profile")}</span>
        </button>

      </div>
    </nav>
  );
};

export default PatientBottomNav;
