import React from "react";
import { Outlet } from "react-router-dom";

/**
 * Pass-through layout for dashboard routes.
 * Dashboard pages already manage their own internal layout
 * (DoctorLayout, PatientBottomNav, etc.), so this stays a no-op
 * wrapper for now to keep existing dashboard rendering untouched.
 */
const DashboardLayout = () => {
  return <Outlet />;
};

export default DashboardLayout;
