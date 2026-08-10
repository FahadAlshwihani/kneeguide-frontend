import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence, useAnimationControls } from "motion/react";
import { LuCircleCheck } from "react-icons/lu";
import { useTranslation } from "react-i18next";

import { verifyOtp, resendOtp } from "../../../api/auth";
import { ROUTES } from "../../../utils/routes";
import { AuthCardItem } from "../components/AuthCard";
import AuthAlert from "../components/AuthAlert";
import PrimaryButton from "../../../components/ui/PrimaryButton";
import "../styles/VerifyOtp.css";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;

// How long the green success state + "Email verified" confirmation holds
// before handing off to the real post-verification navigation —
// deliberately long (~5s, not a quick flash like Login.jsx's own 450ms
// SUCCESS_TRANSITION_MS) so the user has real time to register that
// verification succeeded. Applies identically under reduced motion — see
// handleSubmit below, only the fade-out choreography that follows the
// hold is skipped there, never the hold itself.
const SUCCESS_HOLD_MS = 5000;
const EXIT_MS = 180;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Just this page's own content now — AuthLayout.jsx renders the shared
 * chrome (Grainient/Header/AuthCard/AuthFooter) and VerifyOtp is just
 * another matched child of AuthLayout's one normal <Outlet/>, exactly like
 * Login/Register already are (see routes/PublicRoutes.jsx). Real OTP
 * verification, unchanged contract: still POSTs to users/verify-otp/ with
 * {email, code}, still POSTs to users/resend-otp/ with {email}. The
 * backend only verifies the account here — it never returns a token/user,
 * so success genuinely routes to /login (not Dashboard); see the
 * handleSubmit success branch below.
 */
const VerifyOtp = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const emailParam = new URLSearchParams(location.search).get("email");
  const email = emailParam?.trim().toLowerCase() || "";

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const inputRefs = useRef([]);

  // idle -> nothing to show yet. invalid -> backend rejected the code
  // (red boxes + one-time shake). success -> backend accepted it (green
  // boxes + check-circle text, held briefly before navigating away).
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [resendFeedback, setResendFeedback] = useState(null);
  const [counter, setCounter] = useState(RESEND_COOLDOWN_SECONDS);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const shakeControls = useAnimationControls();
  const successTimeoutRef = useRef(null);
  const exitTimeoutRef = useRef(null);

  useEffect(() => {
    if (!email) navigate(ROUTES.LOGIN, { replace: true });
  }, [email, navigate]);

  useEffect(
    () => () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
    },
    []
  );

  useEffect(() => {
    if (counter <= 0) return undefined;
    const timer = setInterval(() => setCounter((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [counter]);

  const isBusy = loading || status === "success";

  const clearInvalidState = () => {
    if (status === "invalid") {
      setStatus("idle");
      setError("");
    }
  };

  const handleOtpChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;
    clearInvalidState();

    setOtp((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Fills from the first box regardless of which box the paste landed on —
  // the standard OTP-paste convention (matches SMS autofill behavior). A
  // complete 6-digit paste fills every box; a shorter paste fills
  // sequentially and leaves the remaining boxes empty, focused right after
  // the last filled one so typing can continue naturally.
  const handlePaste = (e) => {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!digits) return;
    e.preventDefault();
    clearInvalidState();

    setOtp(Array.from({ length: OTP_LENGTH }, (_, i) => digits[i] || ""));

    const focusIndex = Math.min(digits.length, OTP_LENGTH - 1);
    requestAnimationFrame(() => inputRefs.current[focusIndex]?.focus());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isBusy || !email) return;

    const code = otp.join("");
    if (code.length !== OTP_LENGTH) {
      setError(t("verifyOtp.errors.codeRequired"));
      return;
    }

    setLoading(true);
    setError("");
    setResendFeedback(null);

    try {
      const res = await verifyOtp(email, code);
      if (res?.message !== "OTP verified") {
        throw new Error("Unexpected verify-otp response");
      }

      setLoading(false);
      setStatus("success");

      // The 5s hold itself is unconditional — reduced motion only skips
      // the fade-out choreography that follows it (motion, not whether the
      // user gets meaningful success feedback; the green state + "Email
      // verified" text render instantly either way via `status`/CSS, no
      // animation gates their visibility).
      successTimeoutRef.current = setTimeout(() => {
        if (prefersReducedMotion()) {
          navigate(ROUTES.LOGIN);
          return;
        }
        setLeaving(true);
        exitTimeoutRef.current = setTimeout(() => navigate(ROUTES.LOGIN), EXIT_MS);
      }, SUCCESS_HOLD_MS);
    } catch {
      setLoading(false);
      setStatus("invalid");
      setError(t("verifyOtp.errors.invalid"));

      if (!prefersReducedMotion()) {
        shakeControls.start({
          x: [0, -3, 3, -2, 2, 0],
          transition: { duration: 0.32, ease: "easeInOut" },
        });
      }
      requestAnimationFrame(() => inputRefs.current[0]?.focus());
    }
  };

  const handleResend = async () => {
    if (counter > 0 || resending || isBusy || !email) return;

    setResending(true);
    setResendFeedback(null);

    try {
      const res = await resendOtp(email);
      if (res?.message !== "OTP resent") {
        throw new Error("Unexpected resend-otp response");
      }

      setCounter(RESEND_COOLDOWN_SECONDS);
      setResendFeedback({ type: "success", text: t("verifyOtp.success.resent") });
    } catch {
      setResendFeedback({ type: "error", text: t("verifyOtp.errors.failedResend") });
    } finally {
      setResending(false);
    }
  };

  const reducedMotion = prefersReducedMotion();

  return (
    // Self-contained entrance/exit — see Register.jsx's identical comment
    // for why this never depends on AuthCard's own inherited variants and
    // never gates route-content visibility. `leaving` here plays only
    // after a real, already-confirmed success (handleSubmit above), while
    // this component is still fully mounted — not an AnimatePresence exit
    // wrapping the router's Outlet.
    <motion.form
      className="verify-otp-form"
      onSubmit={handleSubmit}
      noValidate
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={leaving ? { opacity: 0, y: -8 } : { opacity: 1, y: 0 }}
      transition={{
        duration: reducedMotion ? 0 : leaving ? EXIT_MS / 1000 : 0.28,
        ease: leaving ? [0.4, 0, 1, 1] : [0.22, 0.61, 0.36, 1],
      }}
    >
      <AuthCardItem as="div" className="otp-header">
        <h1 className="otp-title">{t("verifyOtp.title")}</h1>
        <p className="otp-subtitle">{t("verifyOtp.subtitle")}</p>
        <p className="otp-email" dir="ltr">
          {email}
        </p>
      </AuthCardItem>

      <AuthCardItem as="div" className="otp-group-wrap">
        <motion.div
          className={`otp-input-group otp-input-group--${status}`}
          dir="ltr"
          role="group"
          aria-label={t("verifyOtp.title")}
          animate={shakeControls}
        >
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(e.target.value, i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              onPaste={handlePaste}
              onFocus={(e) => e.target.select()}
              disabled={isBusy}
              aria-invalid={status === "invalid"}
              aria-label={t("verifyOtp.digitLabel", { position: i + 1 })}
              className="otp-input"
            />
          ))}
        </motion.div>

        {status === "success" ? (
          <motion.p
            className="otp-success-indicator"
            aria-live="polite"
            initial={reducedMotion ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.18, ease: "easeOut" }}
          >
            <LuCircleCheck aria-hidden="true" />
            <span>{t("verifyOtp.success.verified")}</span>
          </motion.p>
        ) : (
          <AuthAlert id="otp-error-message">{error}</AuthAlert>
        )}
      </AuthCardItem>

      <AuthCardItem as="div" className="otp-submit-row">
        <PrimaryButton
          type="submit"
          size="lg"
          fullWidth
          loading={loading}
          disabled={isBusy}
          showArrow={false}
          className="otp-submit"
        >
          {t("verifyOtp.buttons.verify")}
        </PrimaryButton>
      </AuthCardItem>

      <AuthCardItem as="div" className="otp-resend">
        {counter > 0 ? (
          <p className="otp-resend-countdown">{t("verifyOtp.resend.in", { count: counter })}</p>
        ) : (
          <button
            type="button"
            className="otp-resend-button"
            onClick={handleResend}
            disabled={resending || isBusy}
            aria-busy={resending}
          >
            {resending ? t("verifyOtp.resend.sending") : t("verifyOtp.resend.button")}
          </button>
        )}

        <AnimatePresence mode="wait" initial={false}>
          {resendFeedback && (
            <motion.p
              key={resendFeedback.text}
              className={`otp-resend-feedback otp-resend-feedback--${resendFeedback.type}`}
              aria-live="polite"
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.15 }}
            >
              {resendFeedback.text}
            </motion.p>
          )}
        </AnimatePresence>
      </AuthCardItem>

      <AuthCardItem as="p" className="otp-back-login">
        <Link to={ROUTES.LOGIN} className="auth-switch-link">
          {t("verifyOtp.backToLogin")}
        </Link>
      </AuthCardItem>
    </motion.form>
  );
};

export default VerifyOtp;
