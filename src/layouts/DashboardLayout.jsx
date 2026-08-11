import React from "react";
import { Outlet } from "react-router-dom";

/**
 * Pass-through layout for dashboard routes. Doctor pages manage their own
 * internal layout (DoctorLayout); Patient routes get their own nested
 * PatientLayout (see routes/DashboardRoutes.jsx) — this stays a no-op
 * wrapper for everything except one thing:
 * `.dashboard-root` is the typography-boundary hook index.css's product
 * typography rule targets (see the "Product typography boundary" comment
 * there), so the authenticated product UI consistently gets Tajawal. No
 * other layout/spacing/behavior is introduced by this wrapper.
 */
const DashboardLayout = () => {
  return (
    <div className="dashboard-root">
      <Outlet />
    </div>
  );
};

export default DashboardLayout;
