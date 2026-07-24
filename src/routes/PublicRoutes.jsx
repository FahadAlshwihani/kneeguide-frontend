import React from "react";
import { Route } from "react-router-dom";
import { ROUTES } from "../utils/routes";

import PublicLayout from "../layouts/PublicLayout";

// Public pages
import HomePage from "../pages/public/HomePage";
import AboutPage from "../pages/public/AboutPage";
import TechnologyPage from "../pages/public/TechnologyPage";
import FeaturesPage from "../pages/public/FeaturesPage";
import HowItWorksPage from "../pages/public/HowItWorksPage";
import ContactPage from "../pages/public/ContactPage";

// Existing auth pages (kept exactly as-is, rendered standalone)
import Login from "../pages/Login";
import Register from "../pages/Register";
import VerifyOtp from "../pages/VerifyOtp";

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

    {/* Rendered standalone (no header/footer) to preserve existing look/behavior */}
    <Route path={ROUTES.LOGIN} element={<Login />} />
    <Route path={ROUTES.REGISTER} element={<Register />} />
    <Route path={ROUTES.VERIFY_OTP} element={<VerifyOtp />} />
  </>
);

export default PublicRoutes;
