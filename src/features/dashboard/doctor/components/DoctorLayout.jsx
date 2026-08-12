import React from "react";
import DoctorDashboardShell from "./shell/DoctorDashboardShell";

/**
 * Kept as a thin pass-through with the EXACT SAME `{ active, children }`
 * API it always had — every existing Doctor page (DoctorDashboard,
 * DoctorPatients, DoctorCalendar, DoctorReports, DoctorProfile,
 * DoctorPatientProfile, DoctorPatientReportsPage,
 * DoctorPatientExercisesPage, DoctorPatientNewAppointmentPage) already
 * calls `<DoctorLayout active="...">{content}</DoctorLayout>` and needed
 * ZERO changes to pick up the new application shell (Sidebar + Topbar +
 * Assistant Drawer + Notifications + Account menu) — see
 * shell/DoctorDashboardShell.jsx for the actual implementation.
 */
const DoctorLayout = ({ active, children }) => <DoctorDashboardShell active={active}>{children}</DoctorDashboardShell>;

export default DoctorLayout;
