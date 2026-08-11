import React from "react";
import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LuLogOut } from "react-icons/lu";
import { useAuth } from "../context/AuthContext";
import PatientDock from "../features/dashboard/patient/components/PatientDock";
import SidebarLanguageSwitcher from "../components/common/SidebarLanguageSwitcher";
import "../features/dashboard/patient/styles/patientTokens.css";
import "./PatientLayout.css";

/**
 * Shared shell for the Patient Dashboard route group only — nested one
 * level inside DashboardRoutes.jsx's existing <DashboardLayout/>, so
 * Doctor routes (siblings of this nested group, not descendants of it)
 * never see `.patient-shell` or a single one of its tokens/children. This
 * mirrors AuthLayout.jsx's own "shared persistent chrome + one Outlet"
 * pattern: PatientDock is rendered exactly once here, not re-imported by
 * every patient page, so it never remounts on Home <-> Exercises <->
 * Reports <-> Profile navigation.
 *
 * `.patient-shell` is the single import point for patientTokens.css (see
 * that file) — no patient page/component should import it again.
 *
 * `.patient-shell-content` is what owns bottom clearance for the fixed
 * PatientDock (--patient-dock-clearance, patientTokens.css) plus
 * env(safe-area-inset-bottom) — structurally, once, here — instead of
 * each page guessing its own bottom padding for a nav it doesn't render
 * itself anymore.
 *
 * Logout also lives here now, next to the language toggle — audited
 * before moving it: the old PatientDashboard header's logout button was
 * the ONLY working logout control anywhere in the Patient Dashboard
 * (Profile's own "Logout" button under its Security tab has never had a
 * click handler wired to it). Removing Home's header without placing a
 * working logout somewhere would have silently broken real functionality,
 * which the task this implements explicitly forbids — this is the
 * smallest change that keeps it working and available from every patient
 * page, consistent with how the language toggle already works.
 */
const PatientLayout = () => {
  const { t } = useTranslation();
  const { logout } = useAuth();

  return (
    <div className="patient-shell">
      <div className="patient-shell-account">
        <SidebarLanguageSwitcher />
        <button
          type="button"
          className="patient-shell-logout"
          onClick={logout}
          aria-label={t("patientDashboard.logout")}
        >
          <LuLogOut aria-hidden="true" />
        </button>
      </div>

      <div className="patient-shell-content">
        <Outlet />
      </div>

      <PatientDock />
    </div>
  );
};

export default PatientLayout;
