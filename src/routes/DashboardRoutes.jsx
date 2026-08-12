import React from "react";
import { Route } from "react-router-dom";
import { ROUTES } from "../utils/routes";
import ProtectedRoute from "../components/common/ProtectedRoute";
import DashboardLayout from "../layouts/DashboardLayout";
import PatientLayout from "../layouts/PatientLayout";

// Patient
import PatientDashboard from "../features/dashboard/patient/pages/PatientDashboard";
import Reports from "../features/dashboard/patient/pages/Reports";
import PatientExercises from "../features/dashboard/patient/pages/PatientExercises";
import PatientProfile from "../features/dashboard/patient/pages/PatientProfile";
import PatientAppointments from "../features/dashboard/patient/pages/PatientAppointments";

// Doctor
import DoctorDashboard from "../features/dashboard/doctor/pages/DoctorDashboard";
import DoctorPatients from "../features/dashboard/doctor/pages/DoctorPatients";
import DoctorReports from "../features/dashboard/doctor/pages/DoctorReports";
import DoctorCalendar from "../features/dashboard/doctor/pages/DoctorCalendar";
import DoctorProfile from "../features/dashboard/doctor/pages/DoctorProfile";
import DoctorPatientWorkspace from "../features/dashboard/doctor/pages/DoctorPatientWorkspace";

const DashboardRoutes = (
  <Route element={<DashboardLayout />}>
    {/* PATIENT — nested one level under PatientLayout, which renders the
        shared PatientDock/language toggle/token scope exactly once and a
        single Outlet for these four (see layouts/PatientLayout.jsx).
        Doctor routes below are siblings of this nested group, never
        descendants of it, so none of this reaches Doctor screens. Each
        route keeps its own existing ProtectedRoute wrapper unchanged —
        this nesting only adds shared chrome around them, it doesn't touch
        the auth-protection mechanism itself. */}
    <Route element={<PatientLayout />}>
      <Route
        path={ROUTES.PATIENT_DASHBOARD}
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <PatientDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.PATIENT_REPORTS}
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <Reports />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.PATIENT_EXERCISES}
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <PatientExercises />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.PATIENT_PROFILE}
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <PatientProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.PATIENT_APPOINTMENTS}
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <PatientAppointments />
          </ProtectedRoute>
        }
      />
    </Route>

    {/* DOCTOR */}
    <Route
      path={ROUTES.DOCTOR_DASHBOARD}
      element={
        <ProtectedRoute allowedRoles={["doctor"]}>
          <DoctorDashboard />
        </ProtectedRoute>
      }
    />

    <Route
      path={ROUTES.DOCTOR_PATIENTS}
      element={
        <ProtectedRoute allowedRoles={["doctor"]}>
          <DoctorPatients />
        </ProtectedRoute>
      }
    />

    <Route
      path={ROUTES.DOCTOR_REPORTS}
      element={
        <ProtectedRoute allowedRoles={["doctor"]}>
          <DoctorReports />
        </ProtectedRoute>
      }
    />

    <Route
      path={ROUTES.APPOINTMENTS}
      element={
        <ProtectedRoute allowedRoles={["doctor"]}>
          <DoctorCalendar />
        </ProtectedRoute>
      }
    />

    <Route
      path={ROUTES.DOCTOR_PROFILE}
      element={
        <ProtectedRoute allowedRoles={["doctor"]}>
          <DoctorProfile />
        </ProtectedRoute>
      }
    />

    {/* PATIENT WORKSPACE (doctor view) — one page, local tabs (Section 9) */}
    <Route
      path={ROUTES.DOCTOR_PATIENT_PROFILE}
      element={
        <ProtectedRoute allowedRoles={["doctor"]}>
          <DoctorPatientWorkspace />
        </ProtectedRoute>
      }
    />
  </Route>
);

export default DashboardRoutes;
