import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Header from "../features/public/components/Header";
import Grainient from "../features/public/components/Grainient";
import AuthFooter from "../features/auth/components/AuthFooter";
import AuthCard from "../features/auth/components/AuthCard";
import { initPerformanceTier } from "../features/public/performance/performanceTier";
import "../features/auth/styles/AuthForm.css";
import "./SiteBackground.css";
import "./AuthLayout.css";

const GRAINIENT_COLOR_1 = "#2563EB";
const GRAINIENT_COLOR_2 = "#050505";
const GRAINIENT_COLOR_3 = "#1D4ED8";

/**
 * Shared visual chrome for the auth routes. React Router exclusively owns
 * the matched Login/Register/VerifyOtp child lifecycle through this single
 * Outlet. `hideAuthAction` tells Header to hide its own top-level "Login"
 * CTA — correct everywhere under this layout, since every route mounted
 * here already IS the Auth flow (a login-style action here would either
 * link back to the page already on screen or interrupt an in-progress
 * Register/OTP step).
 */
const AuthLayout = () => {
  useEffect(() => {
    initPerformanceTier();
  }, []);

  return (
    <div className="public-root auth-layout-root">
      <Grainient
        className="site-background-canvas"
        color1={GRAINIENT_COLOR_1}
        color2={GRAINIENT_COLOR_2}
        color3={GRAINIENT_COLOR_3}
      />
      <Header hideAuthAction />
      <main className="auth-layout-main">
        <AuthCard>
          <div className="auth-content-frame">
            <Outlet />
          </div>
        </AuthCard>
      </main>
      <AuthFooter />
    </div>
  );
};

export default AuthLayout;
