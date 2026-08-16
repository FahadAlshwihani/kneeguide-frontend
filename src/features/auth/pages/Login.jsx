import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { LuCheck } from "react-icons/lu";
import { useAuth } from "../../../context/AuthContext";
import { ROUTES } from "../../../utils/routes";
import PrimaryButton from "../../../components/ui/PrimaryButton";
import { AuthCardItem } from "../components/AuthCard";
import PasswordField from "../components/PasswordField";
import AuthAlert from "../components/AuthAlert";
import DemoAccess from "../components/DemoAccess";
import "../styles/Login.css";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// How long the brief success checkmark shows before the existing redirect
// fires — short on purpose. Safe to delay: `login()` below has already
// fully persisted the token and updated auth state, synchronously, by the
// time this timer even starts (see handleSubmit) — this only ever defers
// the *navigate* call, never authentication correctness itself.
const SUCCESS_TRANSITION_MS = 450;

/**
 * Just this page's own content now — AuthLayout.jsx renders the shared
 * chrome (Grainient/Header/AuthCard/AuthFooter) and the Login<->Register
 * crossfade around whatever this returns; see that file for why. Real
 * authentication, unchanged contract: still calls the same
 * AuthContext#login(email, password) -> POST users/login/ -> {access, user}
 * -> saveAuthData/setToken/setUser -> role-based redirect.
 */
const Login = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const successTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Fills the SAME controlled state a real user typing into the fields
  // would — never a separate code path, never calls login() itself. The
  // user still has to press the real submit button, same as always.
  const handleUseDemo = ({ email, password }) => {
    setForm({ email, password });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // double-click / double-Enter guard — one attempt while pending
    setError("");

    if (!form.email || !form.password) {
      setError(t("login.error_required"));
      return;
    }

    setLoading(true);

    try {
      const user = await login(form.email, form.password);
      const redirectTo = user.role === "doctor" ? ROUTES.DOCTOR_DASHBOARD : ROUTES.PATIENT_DASHBOARD;

      if (prefersReducedMotion()) {
        navigate(redirectTo);
        return;
      }

      setLoading(false);
      setSuccess(true);
      successTimeoutRef.current = setTimeout(() => navigate(redirectTo), SUCCESS_TRANSITION_MS);
    } catch (err) {
      // Same generic, non-enumerating message regardless of what the
      // backend actually rejected (bad password vs unknown email) —
      // preserved exactly as the existing behavior already had it. Entered
      // email/password are deliberately left in `form`, not cleared.
      setLoading(false);
      setError(t("login.error_invalid"));
    }
  };

  const reducedMotion = prefersReducedMotion();
  const isBusy = loading || success;

  return (
    // Self-contained entrance — initial/animate live on THIS element only,
    // never inherited from AuthCard's own one-time mount variants (see
    // AuthCard.jsx). React Router mounts Login fresh every time the route
    // becomes active, so this plays every time, reliably, independent of
    // whatever AuthCard's own persistent lifecycle is doing. No exit
    // animation: that would require holding this element mounted past its
    // real unmount (AnimatePresence wrapping the route), which is exactly
    // the architecture that caused the earlier blank-card bug — skipped
    // deliberately, not an oversight.
    <motion.form
      className="login-form"
      onSubmit={handleSubmit}
      noValidate
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.28, ease: [0.22, 0.61, 0.36, 1] }}
    >
      <AuthCardItem as="div" className="login-header">
        <h1 className="login-title">{t("login.title")}</h1>
        <p className="login-subtitle">{t("login.subtitle")}</p>
      </AuthCardItem>

      <AuthAlert id="login-error-message">{error}</AuthAlert>

      <AuthCardItem as="div" className="auth-field">
        <label htmlFor="login-email" className="auth-label">
          {t("login.email")}
        </label>
        <input
          id="login-email"
          type="email"
          name="email"
          className="auth-input"
          // Forced LTR regardless of page direction — an email address is
          // Latin-character content by construction, and should read
          // naturally (user@example.com, not bidi-reordered) even inside
          // an RTL form. Only the input's own text runs this way; the
          // <label> above it still follows Arabic's natural RTL flow.
          dir="ltr"
          autoComplete="email"
          placeholder={t("login.email_placeholder")}
          value={form.email}
          onChange={handleChange}
          disabled={isBusy}
          aria-invalid={!!error}
          aria-describedby={error ? "login-error-message" : undefined}
          required
        />
      </AuthCardItem>

      <AuthCardItem as="div">
        <PasswordField
          id="login-password"
          name="password"
          label={t("login.password")}
          value={form.password}
          onChange={handleChange}
          autoComplete="current-password"
          disabled={isBusy}
          error={!!error}
          errorId="login-error-message"
        />
      </AuthCardItem>

      <AuthCardItem as="div" className="login-submit-row">
        <PrimaryButton
          type="submit"
          size="lg"
          fullWidth
          loading={loading}
          disabled={isBusy}
          showArrow={false}
          icon={success ? <LuCheck aria-hidden="true" /> : null}
          className="login-submit"
        >
          {t("login.button")}
        </PrimaryButton>
      </AuthCardItem>

      <AuthCardItem as="div">
        <DemoAccess onUseDemo={handleUseDemo} />
      </AuthCardItem>

      <AuthCardItem as="div" className="login-extra">
        <p>
          {t("login.no_account")}{" "}
          <Link to={ROUTES.REGISTER} className="auth-switch-link">
            {t("login.signup")}
          </Link>
        </p>
      </AuthCardItem>
    </motion.form>
  );
};

export default Login;
