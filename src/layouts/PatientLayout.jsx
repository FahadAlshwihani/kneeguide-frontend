import React from "react";
import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LuLogOut } from "react-icons/lu";
import { useAuth } from "../context/AuthContext";
import PatientDock from "../features/dashboard/patient/components/PatientDock";
import { KneeGuideDeviceProvider } from "../features/dashboard/patient/device/KneeGuideDeviceContext";
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
 * Logout lives here — audited before ever moving it (in an earlier
 * round): the old PatientDashboard header's logout button was the ONLY
 * working logout control anywhere in the Patient Dashboard (Profile's own
 * "Logout" button under its Security tab has never had a click handler
 * wired to it). Kept here, now alone, after this round's own removal of
 * the floating language switcher from Patient scope (see below) — Patient
 * language selection is intentionally moving to Profile/Settings in a
 * future task; this only removes the UI control, never i18n itself
 * (SidebarLanguageSwitcher, the actual component, is untouched — still
 * imported/rendered exactly as before by DoctorSidebar; only this file
 * stopped rendering it). The app's current language keeps rendering
 * everywhere via the same i18next instance regardless of this control's
 * presence.
 *
 * `KneeGuideDeviceProvider` wraps the Outlet for the exact same reason
 * PatientDock lives here instead of on each page: Patient Profile's
 * Devices tab and the KneeGuide Assistant's device-connect capability
 * must read the SAME scan/connect state, not two independent copies —
 * mounting the provider once, above every Patient page, is what makes
 * that guaranteed rather than coincidental (see
 * device/KneeGuideDeviceContext.jsx).
 */
const PatientLayout = () => {
  const { t } = useTranslation();
  const { logout } = useAuth();

  return (
    <div className="patient-shell">
      <button
        type="button"
        className="patient-shell-logout"
        onClick={logout}
        aria-label={t("patientDashboard.logout")}
      >
        <LuLogOut aria-hidden="true" />
      </button>

      <KneeGuideDeviceProvider>
        <div className="patient-shell-content">
          <Outlet />
        </div>
      </KneeGuideDeviceProvider>

      <PatientDock />
    </div>
  );
};

export default PatientLayout;
