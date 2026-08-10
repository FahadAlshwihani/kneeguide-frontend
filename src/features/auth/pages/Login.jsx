import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import { LuEye, LuEyeOff, LuCheck } from "react-icons/lu";
import { useAuth } from "../../../context/AuthContext";
import { ROUTES } from "../../../utils/routes";
import PrimaryButton from "../../../components/ui/PrimaryButton";
import AuthCard, { AuthCardItem } from "../components/AuthCard";
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
 * Real authentication, unchanged contract: still calls the same
 * AuthContext#login(email, password) -> POST users/login/ -> {access, user}
 * -> saveAuthData/setToken/setUser -> role-based redirect. Everything in
 * this file is presentation/UX around that exact same call.
 */
const Login = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
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

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
  const reducedMotion = prefersReducedMotion();
  const isBusy = loading || success;

  return (
    <div className="login-page">
      <AuthCard className="login-card">
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <AuthCardItem as="h1" className="login-title">
            {t("login.title")}
          </AuthCardItem>
          <AuthCardItem as="p" className="login-subtitle">
            {t("login.subtitle")}
          </AuthCardItem>

          <AnimatePresence>
            {error && (
              <motion.div
                key="login-error"
                id="login-error-message"
                className="login-error"
                role="alert"
                initial={reducedMotion ? false : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reducedMotion ? 0.15 : 0.25, ease: "easeOut" }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <AuthCardItem as="div" className="login-field">
            <label htmlFor="login-email" className="login-label">
              {t("login.email")}
            </label>
            <input
              id="login-email"
              type="email"
              name="email"
              className="login-input"
              // Forced LTR regardless of page direction — an email address
              // is Latin-character content by construction, and should
              // read naturally (user@example.com, not bidi-reordered) even
              // inside an RTL form. Only the input's own text runs this
              // way; the <label> above it still follows Arabic's natural
              // RTL flow untouched.
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

          <AuthCardItem as="div" className="login-field">
            <label htmlFor="login-password" className="login-label">
              {t("login.password")}
            </label>
            <div className="login-password-wrap">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                name="password"
                className="login-input"
                autoComplete="current-password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                disabled={isBusy}
                aria-invalid={!!error}
                aria-describedby={error ? "login-error-message" : undefined}
                required
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={togglePasswordVisibility}
                disabled={isBusy}
                aria-label={t(showPassword ? "login.hidePassword" : "login.showPassword")}
              >
                {showPassword ? <LuEyeOff aria-hidden="true" /> : <LuEye aria-hidden="true" />}
              </button>
            </div>
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

          <AuthCardItem as="div" className="login-extra">
            <p>
              {t("login.no_account")}{" "}
              <Link to={ROUTES.REGISTER} className="login-signup-link">
                {t("login.signup")}
              </Link>
            </p>
          </AuthCardItem>
        </form>
      </AuthCard>
    </div>
  );
};

export default Login;
