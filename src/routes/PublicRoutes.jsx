import React from "react";
import { Route } from "react-router-dom";
import { ROUTES } from "../utils/routes";

import PublicLayout from "../layouts/PublicLayout";

// Public pages
import HomePage from "../features/public/pages/HomePage";
import AboutPage from "../features/public/pages/AboutPage";
import TechnologyPage from "../features/public/pages/TechnologyPage";
import FeaturesPage from "../features/public/pages/FeaturesPage";
import HowItWorksPage from "../features/public/pages/HowItWorksPage";
import ContactPage from "../features/public/pages/ContactPage";

// Existing auth pages (kept exactly as-is, rendered standalone)
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

    {/* Rendered standalone (no header/footer) to preserve existing look/behavior */}
    <Route path={ROUTES.LOGIN} element={<Login />} />
    <Route path={ROUTES.REGISTER} element={<Register />} />
    <Route path={ROUTES.VERIFY_OTP} element={<VerifyOtp />} />
  </>
);

export default PublicRoutes;
