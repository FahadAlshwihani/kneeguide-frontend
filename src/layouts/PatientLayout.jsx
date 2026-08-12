import React from "react";
import { Outlet } from "react-router-dom";
import PatientDock from "../features/dashboard/patient/components/PatientDock";
import { KneeGuideDeviceProvider } from "../features/dashboard/patient/device/KneeGuideDeviceContext";
import { PatientPreferencesProvider, usePatientPreferences } from "../features/dashboard/patient/preferences/PatientPreferencesContext";
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
 * Logout no longer lives here (Profile V2, Section 4) — it used to be a
 * fixed top-end icon rendered on every Patient page, which meant Profile's
 * own Security tab and this layout were two competing logout locations.
 * The REAL logout implementation (`useAuth().logout`) is unchanged; only
 * its one caller moved, to Profile -> Security (see
 * pages/PatientProfile.jsx / components/profile/ProfileSecurityTab.jsx).
 *
 * `KneeGuideDeviceProvider` wraps the Outlet for the exact same reason
 * PatientDock lives here instead of on each page: Patient Profile's
 * Devices tab and the KneeGuide Assistant's device-connect capability
 * must read the SAME scan/connect state, not two independent copies —
 * mounting the provider once, above every Patient page, is what makes
 * that guaranteed rather than coincidental (see
 * device/KneeGuideDeviceContext.jsx).
 *
 * `PatientPreferencesProvider` is the equivalent single mount point for
 * language + appearance (Profile V2, Section 40) — `PatientShellInner`
 * below reads the resolved theme back out of it and stamps
 * `data-patient-theme` on `.patient-shell` itself, which is what
 * patientTokens.css's light-mode override block selects on. Scoped to
 * this one element (never `:root`/`document.body`), so Doctor/Public/Auth
 * routes — siblings of this nested group, not descendants — are
 * structurally unable to see a Patient theme change.
 */
const PatientShellInner = () => {
  const { resolvedTheme } = usePatientPreferences();

  return (
    <div className="patient-shell" data-patient-theme={resolvedTheme}>
      <KneeGuideDeviceProvider>
        <div className="patient-shell-content">
          <Outlet />
        </div>
      </KneeGuideDeviceProvider>

      <PatientDock />
    </div>
  );
};

const PatientLayout = () => (
  <PatientPreferencesProvider>
    <PatientShellInner />
  </PatientPreferencesProvider>
);

export default PatientLayout;
