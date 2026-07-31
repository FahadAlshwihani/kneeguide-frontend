import React from "react";
import { Route } from "react-router-dom";
import { ROUTES } from "../utils/routes";
import ProtectedRoute from "../components/common/ProtectedRoute";
import DashboardLayout from "../layouts/DashboardLayout";

// Patient
import PatientDashboard from "../features/dashboard/patient/pages/PatientDashboard";
import Reports from "../features/dashboard/patient/pages/Reports";
import PatientExercises from "../features/dashboard/patient/pages/PatientExercises";
import PatientProfile from "../features/dashboard/patient/pages/PatientProfile";

// Doctor
import DoctorDashboard from "../features/dashboard/doctor/pages/DoctorDashboard";
import DoctorPatients from "../features/dashboard/doctor/pages/DoctorPatients";
import DoctorReports from "../features/dashboard/doctor/pages/DoctorReports";
import DoctorCalendar from "../features/dashboard/doctor/pages/DoctorCalendar";
import DoctorProfile from "../features/dashboard/doctor/pages/DoctorProfile";
import DoctorPatientProfile from "../features/dashboard/doctor/pages/DoctorPatientProfile";

// Doctor patient tools
import DoctorPatientReportsPage from "../features/dashboard/doctor/pages/DoctorPatientReportsPage";
import DoctorPatientExercisesPage from "../features/dashboard/doctor/pages/DoctorPatientExercisesPage";
import DoctorPatientNewAppointmentPage from "../features/dashboard/doctor/pages/DoctorPatientNewAppointmentPage";

const DashboardRoutes = (
  <Route element={<DashboardLayout />}>
    {/* PATIENT */}
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
      path="/patient/exercises"
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

    {/* PATIENT-SPECIFIC (doctor view) */}
    <Route
      path={ROUTES.DOCTOR_PATIENT_PROFILE}
      element={
        <ProtectedRoute allowedRoles={["doctor"]}>
          <DoctorPatientProfile />
        </ProtectedRoute>
      }
    />

    <Route
      path={ROUTES.DOCTOR_PATIENT_REPORTS}
      element={
        <ProtectedRoute allowedRoles={["doctor"]}>
          <DoctorPatientReportsPage />
        </ProtectedRoute>
      }
    />

    <Route
      path={ROUTES.DOCTOR_PATIENT_EXERCISES}
      element={
        <ProtectedRoute allowedRoles={["doctor"]}>
          <DoctorPatientExercisesPage />
        </ProtectedRoute>
      }
    />

    <Route
      path={ROUTES.DOCTOR_PATIENT_NEW_APPOINTMENT}
      element={
        <ProtectedRoute allowedRoles={["doctor"]}>
          <DoctorPatientNewAppointmentPage />
        </ProtectedRoute>
      }
    />
  </Route>
);

export default DashboardRoutes;
