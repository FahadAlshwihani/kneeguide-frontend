import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { LuUserRound } from "react-icons/lu";
import { FaUserDoctor } from "react-icons/fa6";
import { useTranslation } from "react-i18next";
import Stepper, { Step } from "../../../components/ui/Stepper";
import { registerUser, checkEmail } from "../../../api/auth";
import { ROUTES } from "../../../utils/routes";
import { AuthCardItem } from "../components/AuthCard";
import PasswordField from "../components/PasswordField";
import AuthAlert from "../components/AuthAlert";
import PasswordChecklist, { PasswordMatchStatus } from "../components/PasswordChecklist";
import { isPasswordStrong } from "../utils/passwordRequirements";
import "../styles/Register.css";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Register content's own exit, before handing off to OTP — see
// handleFinalSubmit. Short on purpose (well under the card's own resize
// transition in AuthCard.jsx) so the sequence reads as "content leaves,
// then the card settles into OTP's shorter height, then OTP arrives"
// rather than three simultaneous changes.
const REGISTER_EXIT_MS = 180;

/**
 * Just this page's own content now — AuthLayout.jsx renders the shared
 * chrome (Grainient/Header/AuthCard/AuthFooter) and the Login<->Register
 * crossfade around whatever this returns (see that file). Real
 * registration, unchanged contract: still POSTs to users/register/ with
 * the exact same payload shape, still routes to /auth/verify-otp on the
 * same backend response, still uses the same per-step validation rules
 * (validateStep below) — nothing about that logic changed, only its
 * presentation and the fact that it now lives inside the shared card
 * instead of its own standalone page.
 */
const Register = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState(null);
  const [emailExists, setEmailExists] = useState(false);
  const [emailCheckStatus, setEmailCheckStatus] = useState("idle");
  const emailCheckRef = useRef(null);
  const latestEmailRef = useRef("");

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    dob: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [leaving, setLeaving] = useState(false);
  const exitTimeoutRef = useRef(null);

  useEffect(() => () => {
    if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((previous) => ({ ...previous, [name]: value }));

    if (name === "email") {
      latestEmailRef.current = value;
      setEmailExists(false);
      setEmailCheckStatus("idle");

      const pendingCheck = emailCheckRef.current;
      if (pendingCheck && pendingCheck.email !== value.trim().toLowerCase()) {
        pendingCheck.controller.abort();
        emailCheckRef.current = null;
      }
    }
  };

  // ==========================================
  // STEP VALIDATION
  // ==========================================
  const validateStep = async (step) => {
    setError("");

    switch (step) {
      case 1:
        if (!role) {
          setError(t("register.errors.selectRole"));
          return false;
        }
        return true;

      case 2:
        if (!form.first_name || !form.last_name) {
          setError(t("register.errors.fullName"));
          return false;
        }
        return true;

      case 3:
        if (!form.email || !form.phone || !form.dob) {
          setError(t("register.errors.contactRequired"));
          return false;
        }

        const normalizedEmail = form.email.trim().toLowerCase();
        if (!isValidEmail(normalizedEmail)) {
          setError(t("register.errors.emailInvalid"));
          return false;
        }

        setEmailCheckStatus("checking");

        try {
          let pendingCheck = emailCheckRef.current;

          if (!pendingCheck || pendingCheck.email !== normalizedEmail) {
            const controller = new AbortController();
            pendingCheck = {
              email: normalizedEmail,
              controller,
              promise: checkEmail(normalizedEmail, { signal: controller.signal }),
            };
            emailCheckRef.current = pendingCheck;
          }

          const emailCheck = await pendingCheck.promise;
          if (latestEmailRef.current.trim().toLowerCase() !== normalizedEmail) {
            setEmailCheckStatus("idle");
            return false;
          }

          if (emailCheck.exists) {
            setEmailExists(true);
            setEmailCheckStatus("exists");
            setError(t("register.errors.emailExists"));
            return false;
          }

          setEmailCheckStatus("available");
        } catch (e) {
          if (e.code === "ERR_CANCELED") {
            setEmailCheckStatus("idle");
            return false;
          }
          setEmailCheckStatus("error");
          setError(t("register.errors.emailCheckFailed"));
          return false;
        } finally {
          if (emailCheckRef.current?.email === normalizedEmail) {
            emailCheckRef.current = null;
          }
        }

        return true;

      case 4:
        if (!form.password || !form.confirmPassword) {
          setError(t("register.errors.passwordRequired"));
          return false;
        }

        if (form.password !== form.confirmPassword) {
          setError(t("register.errors.passwordMismatch"));
          return false;
        }

        if (!isPasswordStrong(form.password)) {
          setError(t("register.errors.passwordWeak"));
          return false;
        }

        return true;

      default:
        return true;
    }
  };

  // ==========================================
  // FINAL SUBMIT
  // ==========================================
  const handleFinalSubmit = async () => {
    if (loading) return;
    setError("");
    setLoading(true);

    const payload = {
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email.trim().toLowerCase(),
      phone: form.phone,
      dob: form.dob,
      password: form.password,
      role,
    };

    try {
      const res = await registerUser(payload);

      if (res?.message === "OTP sent to email") {
        const query = new URLSearchParams({ email: payload.email });
        const destination = `${ROUTES.VERIFY_OTP}?${query.toString()}`;

        // loading stays true (button keeps its loading state) all the way
        // through this hand-off — never reset to false on the success path,
        // so there's no flash of an interactive "Complete" button between
        // the request finishing and OTP taking over.
        if (prefersReducedMotion()) {
          navigate(destination);
          return;
        }

        setLeaving(true);
        exitTimeoutRef.current = setTimeout(() => navigate(destination), REGISTER_EXIT_MS);
        return;
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(t("register.errors.genericFail"));
    }
  };

  const reducedMotion = prefersReducedMotion();
  // The email-exists case already gets its own more actionable inline box
  // (with a link straight to Login) right where it's relevant, in step 3
  // — showing the generic top banner too would just say the same thing
  // twice in two different boxes.
  const showGeneralError = !!error && !emailExists;

  return (
    // Self-contained entrance — see Login.jsx's identical comment for why
    // this never depends on AuthCard's own inherited variants. The one exit
    // this component ever plays is its OWN registration-success hand-off to
    // OTP (`leaving`, driven by handleFinalSubmit above) — Register is still
    // fully mounted while it plays, then unmounts via a real route change
    // once the timeout fires. This is deliberately NOT an AnimatePresence
    // exit wrapping the router's Outlet (see AuthLayout.jsx / AuthCard.jsx
    // for why that pattern caused the earlier blank-card bug) — nothing
    // here ever gates whether route content is visible, it only animates
    // content that is, at every moment, genuinely still mounted.
    <motion.div
      className="register-content"
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={leaving ? { opacity: 0, y: -8 } : { opacity: 1, y: 0 }}
      transition={{
        duration: reducedMotion ? 0 : leaving ? REGISTER_EXIT_MS / 1000 : 0.28,
        ease: leaving ? [0.4, 0, 1, 1] : [0.22, 0.61, 0.36, 1],
      }}
    >
      <AuthCardItem as="h1" className="register-title">
        {t("register.title")}
      </AuthCardItem>

      <AuthAlert>{showGeneralError ? error : ""}</AuthAlert>

      <AuthCardItem as="div" className="register-stepper-box">
        <Stepper
          initialStep={1}
          validateStep={validateStep}
          onFinalStepCompleted={handleFinalSubmit}
          submitting={loading}
          validating={emailCheckStatus === "checking"}
        >
          {/* STEP 1 — role */}
          <Step>
            <h3 data-step-heading tabIndex={-1} className="step-title">
              {t("register.step1Title")}
            </h3>

            <div className="role-picker">
              <button
                type="button"
                className={`role-card${role === "patient" ? " role-card-selected" : ""}`}
                onClick={() => setRole("patient")}
                aria-pressed={role === "patient"}
              >
                <LuUserRound className="role-card-icon" aria-hidden="true" />
                <h4>{t("register.rolePatient")}</h4>
                <p>{t("register.rolePatientDesc")}</p>
              </button>

              <button
                type="button"
                className={`role-card${role === "doctor" ? " role-card-selected" : ""}`}
                onClick={() => setRole("doctor")}
                aria-pressed={role === "doctor"}
              >
                <FaUserDoctor className="role-card-icon" aria-hidden="true" />
                <h4>{t("register.roleDoctor")}</h4>
                <p>{t("register.roleDoctorDesc")}</p>
              </button>
            </div>

            {/* Contextual, role-aware only — never both blocks at once,
                never shown before a role is picked (Section 11 of the
                task this was built for). */}
            {role === "patient" && (
              <p className="register-role-hint">{t("auth.demo.patientRegisterHint")}</p>
            )}
            {role === "doctor" && (
              <p className="register-role-hint">
                {t("auth.demo.doctorApprovalHint")}{" "}
                <Link to={ROUTES.LOGIN} className="auth-switch-link">
                  {t("register.goToLogin")}
                </Link>
              </p>
            )}
          </Step>

          {/* STEP 2 — name */}
          <Step>
            <h3 data-step-heading tabIndex={-1} className="step-title">
              {t("register.step2Title")}
            </h3>

            <div className="form-two-column">
              <div className="auth-field">
                <label htmlFor="register-first-name" className="auth-label">
                  {t("register.labels.firstName")}
                </label>
                <input
                  id="register-first-name"
                  type="text"
                  name="first_name"
                  className="auth-input"
                  value={form.first_name}
                  onChange={handleChange}
                  placeholder={t("register.placeholders.firstName")}
                  autoComplete="given-name"
                  required
                />
              </div>

              <div className="auth-field">
                <label htmlFor="register-last-name" className="auth-label">
                  {t("register.labels.lastName")}
                </label>
                <input
                  id="register-last-name"
                  type="text"
                  name="last_name"
                  className="auth-input"
                  value={form.last_name}
                  onChange={handleChange}
                  placeholder={t("register.placeholders.lastName")}
                  autoComplete="family-name"
                  required
                />
              </div>
            </div>
          </Step>

          {/* STEP 3 — contact */}
          <Step>
            <h3 data-step-heading tabIndex={-1} className="step-title">
              {t("register.step3Title")}
            </h3>

            <div className="auth-field">
              <label htmlFor="register-email" className="auth-label">
                {t("register.labels.email")}
              </label>
              <input
                id="register-email"
                type="email"
                name="email"
                className="auth-input"
                dir="ltr"
                value={form.email}
                onChange={handleChange}
                placeholder={t("register.placeholders.email")}
                autoComplete="email"
                required
              />
            </div>

            <AuthAlert>
              {emailExists ? (
                <>
                  {t("register.emailExists")}{" "}
                  <Link to={ROUTES.LOGIN} className="auth-switch-link">
                    {t("register.goToLogin")}
                  </Link>
                </>
              ) : (
                ""
              )}
            </AuthAlert>

            <div className="auth-field">
              <label htmlFor="register-phone" className="auth-label">
                {t("register.labels.phone")}
              </label>
              <input
                id="register-phone"
                type="tel"
                name="phone"
                className="auth-input"
                dir="ltr"
                value={form.phone}
                onChange={handleChange}
                placeholder={t("register.placeholders.phone")}
                autoComplete="tel"
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="register-dob" className="auth-label">
                {t("register.labels.dob")}
              </label>
              <input
                id="register-dob"
                type="date"
                name="dob"
                className="auth-input"
                value={form.dob}
                onChange={handleChange}
                required
              />
            </div>
          </Step>

          {/* STEP 4 — password */}
          <Step>
            <h3 data-step-heading tabIndex={-1} className="step-title">
              {t("register.step4Title")}
            </h3>

            <div className="password-field-group">
              <PasswordField
                id="register-password"
                name="password"
                label={t("register.labels.password")}
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
              <PasswordChecklist password={form.password} />
            </div>

            <div className="password-field-group">
              <PasswordField
                id="register-confirm-password"
                name="confirmPassword"
                label={t("register.labels.confirmPassword")}
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />
              <PasswordMatchStatus password={form.password} confirmPassword={form.confirmPassword} />
            </div>
          </Step>

          {/* STEP 5 — review */}
          <Step>
            <h3 data-step-heading tabIndex={-1} className="step-title">
              {t("register.step5Title")}
            </h3>

            <div className="review-box">
              <p>
                <strong>{t("register.review.role")}:</strong> {role}
              </p>
              <p>
                <strong>{t("register.review.name")}:</strong>{" "}
                {form.first_name} {form.last_name}
              </p>
              <p>
                <strong>{t("register.review.email")}:</strong> {form.email}
              </p>
              <p>
                <strong>{t("register.review.phone")}:</strong> {form.phone}
              </p>
              <p>
                <strong>{t("register.review.dob")}:</strong> {form.dob}
              </p>
            </div>
          </Step>
        </Stepper>
      </AuthCardItem>

      {/* Separate from the Stepper's own Back button (previous step) and
          from Next/Complete (validate + advance/submit) — this is the
          third, distinct navigation concept: leaving Register entirely
          for the real /login route. Always visible, regardless of step. */}
      <AuthCardItem as="p" className="register-switch">
        {t("register.haveAccount")}{" "}
        <Link to={ROUTES.LOGIN} className="auth-switch-link">
          {t("register.loginLink")}
        </Link>
      </AuthCardItem>
    </motion.div>
  );
};

export default Register;
