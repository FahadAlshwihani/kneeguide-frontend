import React from "react";
import { useTranslation } from "react-i18next";
import "./AuthFooter.css";

/**
 * The minimal footer for auth pages (Login now, Register/Forgot Password/
 * OTP later) — deliberately not the full public <Footer/>, which carries
 * product navigation that would compete with a focused auth flow. Reuses
 * publicFooter.copyright verbatim (same key the real Footer uses) rather
 * than adding a duplicate translation for the same sentence.
 */
const AuthFooter = () => {
  const { t } = useTranslation();

  return (
    <footer className="auth-footer">
      <p className="auth-footer-copyright">
        {t("publicFooter.copyright", { year: new Date().getFullYear() })}
      </p>
    </footer>
  );
};

export default AuthFooter;
