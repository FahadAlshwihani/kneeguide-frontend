import React from "react";
import { Outlet } from "react-router-dom";
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
 */
const PatientLayout = () => {
  return (
    <div className="patient-shell">
      <div className="patient-shell-lang">
        <SidebarLanguageSwitcher />
      </div>

      <div className="patient-shell-content">
        <Outlet />
      </div>

      <PatientDock />
    </div>
  );
};

export default PatientLayout;
