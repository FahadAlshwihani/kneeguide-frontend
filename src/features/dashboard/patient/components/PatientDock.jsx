import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LuHouse, LuDumbbell, LuFileText, LuUserRound } from "react-icons/lu";
import Dock from "../../../../components/ui/Dock";
import { ROUTES } from "../../../../utils/routes";
import "./PatientDock.css";

const ICON_SIZE = 20;

// Route config lives here — the generic Dock (components/ui/Dock.jsx)
// never sees a patient route/icon/label directly, so a future, separately
// designed Doctor navigation can be built without touching or extending
// this file or the generic primitive. All four routes are real,
// already-implemented patient pages (routes/DashboardRoutes.jsx) — this
// is a 1:1 map onto that reality, not new/invented navigation.
const NAV_ITEMS = [
  { key: "home", to: ROUTES.PATIENT_DASHBOARD, Icon: LuHouse, labelKey: "patientBottomNav.home" },
  { key: "exercises", to: ROUTES.PATIENT_EXERCISES, Icon: LuDumbbell, labelKey: "patientBottomNav.exercises" },
  { key: "reports", to: ROUTES.PATIENT_REPORTS, Icon: LuFileText, labelKey: "patientBottomNav.reports" },
  { key: "profile", to: ROUTES.PATIENT_PROFILE, Icon: LuUserRound, labelKey: "patientBottomNav.profile" },
];

/**
 * Patient-specific configuration + KneeGuide theming around the generic
 * Dock primitive. Rendered once by PatientLayout.jsx, not per-page — see
 * that file for why (no remounting between patient routes, matching the
 * same "shared persistent chrome, single Outlet" lesson AuthLayout.jsx
 * already established for Login/Register/OTP).
 *
 * Active route is derived from `useLocation()`, not passed in by each
 * page as a string (the old PatientBottomNav's `active="home"` prop,
 * error-prone by construction — a page could easily forget to update it
 * or typo it). `startsWith` covers any future nested route under one of
 * these four (e.g. `/patient/exercises/:id`) resolving to the same parent
 * Dock item, per the task's nested-route requirement — none of the
 * current four routes have children today, so this is a no-op in
 * practice, not a hypothetical over-build (it costs one string check
 * already needed for the exact-match case).
 */
const PatientDock = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  const items = useMemo(
    () =>
      NAV_ITEMS.map(({ key, to, Icon, labelKey }) => ({
        key,
        to,
        label: t(labelKey),
        active: pathname === to || pathname.startsWith(`${to}/`),
        icon: <Icon size={ICON_SIZE} />,
      })),
    [pathname, t]
  );

  return (
    <div className="patient-dock-wrapper">
      <Dock
        items={items}
        ariaLabel={t("patientBottomNav.navLabel")}
        className="patient-dock"
        panelHeight={64}
        baseItemSize={48}
        magnification={64}
        distance={180}
        dockHeight={128}
      />
    </div>
  );
};

export default PatientDock;
