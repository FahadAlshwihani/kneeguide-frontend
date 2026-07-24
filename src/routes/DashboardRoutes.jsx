import React from "react";
import { Route } from "react-router-dom";
import { ROUTES } from "../utils/routes";
import ProtectedRoute from "../components/common/ProtectedRoute";
import DashboardLayout from "../layouts/DashboardLayout";

// Patient
import PatientDashboard from "../pages/PatientDashboard";
import Reports from "../pages/Reports";
import PatientExercises from "../pages/PatientExercises";
import PatientProfile from "../pages/PatientProfile";

// Doctor
import DoctorDashboard from "../pages/DoctorDashboard";
import DoctorPatients from "../pages/DoctorPatients";
import DoctorReports from "../pages/DoctorReports";
import DoctorCalendar from "../pages/DoctorCalendar";
import DoctorProfile from "../pages/DoctorProfile";
import DoctorPatientProfile from "../pages/DoctorPatientProfile";

// Doctor patient tools
import DoctorPatientReportsPage from "../pages/DoctorPatientReportsPage";
import DoctorPatientExercisesPage from "../pages/DoctorPatientExercisesPage";
import DoctorPatientNewAppointmentPage from "../pages/DoctorPatientNewAppointmentPage";

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
