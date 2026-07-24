import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ROUTES } from "../../utils/routes";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading session...</div>;
  }

  if (!isAuthenticated) {
    // لو مو مسجل → رجعه للّوجن
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // لو مسجل لكن ما يملك الدور المطلوب
    // نقدر نوجهه لصفحة أخرى أو داشبورده
    if (user.role === "doctor") {
      return <Navigate to={ROUTES.DOCTOR_DASHBOARD} replace />;
    }
    if (user.role === "patient") {
      return <Navigate to={ROUTES.PATIENT_DASHBOARD} replace />;
    }
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return children;
};

export default ProtectedRoute;
