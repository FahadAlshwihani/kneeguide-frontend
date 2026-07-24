import React from "react";
import {
  FaUserMd,
  FaUsers,
  FaCalendarAlt,
  FaChartLine,
  FaSignOutAlt,
  FaFileAlt,
} from "react-icons/fa";

import { useNavigate, useLocation } from "react-router-dom";
import { ROUTES } from "../../utils/routes";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";

import SidebarLanguageSwitcher from "../common/SidebarLanguageSwitcher"; // ← تمت إضافته
import "../../styles/DoctorSidebar.css";

const DoctorSidebar = ({ active }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="doctor-sidebar">

      {/* Header */}
      <div className="sidebar-header">
        <FaUserMd size={32} />
        <h2>{t("doctorSidebar.title")}</h2>
      </div>

      {/* NAV MENU */}
      <ul className="sidebar-menu">

        {/* Dashboard */}
        <li
          className={`menu-item ${active === "dashboard" ? "active" : ""}`}
          onClick={() => navigate(ROUTES.DOCTOR_DASHBOARD)}
        >
          <FaChartLine className="icon" />
          {t("doctorSidebar.dashboard")}
        </li>

        {/* Patients */}
        <li
          className={`menu-item ${
            pathname === ROUTES.DOCTOR_PATIENTS ? "active" : ""
          }`}
          onClick={() => navigate(ROUTES.DOCTOR_PATIENTS)}
        >
          <FaUsers className="icon" />
          {t("doctorSidebar.patients")}
        </li>

        {/* Appointments */}
        <li
          className={`menu-item ${
            pathname === ROUTES.APPOINTMENTS ? "active" : ""
          }`}
          onClick={() => navigate(ROUTES.APPOINTMENTS)}
        >
          <FaCalendarAlt className="icon" />
          {t("doctorSidebar.appointments")}
        </li>

        {/* Reports */}
        <li
          className={`menu-item ${
            pathname === ROUTES.DOCTOR_REPORTS ? "active" : ""
          }`}
          onClick={() => navigate(ROUTES.DOCTOR_REPORTS)}
        >
          <FaFileAlt className="icon" />
          {t("doctorSidebar.reports")}
        </li>

        {/* Profile */}
        <li
          className={`menu-item ${active === "profile" ? "active" : ""}`}
          onClick={() => navigate(ROUTES.DOCTOR_PROFILE)}
        >
          <FaUserMd className="icon" />
          {t("doctorSidebar.profile")}
        </li>
      </ul>

      {/* 🌐 LANGUAGE SWITCHER — يوضع فوق Logout */}
      

      {/* FOOTER LOGOUT */}
      <div className="sidebar-footer">
        <SidebarLanguageSwitcher />
        <button className="logout-btn" onClick={handleLogout}>
          <FaSignOutAlt className="icon" />
          {t("doctorSidebar.logout")}
        </button>
      </div>

    </div>
  );
};

export default DoctorSidebar;
