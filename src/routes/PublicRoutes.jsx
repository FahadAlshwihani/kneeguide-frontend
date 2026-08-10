import React from "react";
import { Route } from "react-router-dom";
import { ROUTES } from "../utils/routes";

import PublicLayout from "../layouts/PublicLayout";
import AuthLayout from "../layouts/AuthLayout";

// Public pages
import HomePage from "../features/public/pages/HomePage";
import AboutPage from "../features/public/pages/AboutPage";
import TechnologyPage from "../features/public/pages/TechnologyPage";
import FeaturesPage from "../features/public/pages/FeaturesPage";
import HowItWorksPage from "../features/public/pages/HowItWorksPage";
import ContactPage from "../features/public/pages/ContactPage";

// Existing auth pages (kept exactly as-is)
import Login from "../features/auth/pages/Login";
import Register from "../features/auth/pages/Register";
import VerifyOtp from "../features/auth/pages/VerifyOtp";

const PublicRoutes = (
  <>
    <Route element={<PublicLayout />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/technology" element={<TechnologyPage />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/contact" element={<ContactPage />} />
    </Route>

    {/* Login, Register, and VerifyOtp all share one persistent AuthLayout
        (Header/Grainient/AuthCard/AuthFooter) while React Router renders
        each matched page through the layout's single normal Outlet — the
        same architecture Codex's routing fix established. VerifyOtp joining
        this group is exactly what makes Register -> OTP feel like another
        state of the same AuthCard instead of a page navigation. */}
    <Route element={<AuthLayout />}>
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route path={ROUTES.REGISTER} element={<Register />} />
      <Route path={ROUTES.VERIFY_OTP} element={<VerifyOtp />} />
    </Route>
  </>
);

export default PublicRoutes;
