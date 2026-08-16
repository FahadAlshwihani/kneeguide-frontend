import React, { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { LuChevronDown, LuCopy, LuCheck } from "react-icons/lu";
import { DEMO_ACCOUNTS } from "../data/demoAccounts";
import "./DemoAccess.css";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const COPY_FEEDBACK_MS = 1600;

/** One labeled credential value + its own copy button. */
const CredentialRow = ({ label, value, copied, onCopy, copyAriaLabel }) => (
  <div className="demo-credential-row">
    <span className="demo-credential-label">{label}</span>
    <div className="demo-credential-value-row">
      <span className="demo-credential-value" dir="ltr">
        {value}
      </span>
      <button type="button" className="demo-copy-btn" onClick={onCopy} aria-label={copyAriaLabel}>
        {copied ? <LuCheck aria-hidden="true" /> : <LuCopy aria-hidden="true" />}
      </button>
    </div>
  </div>
);

/**
 * Compact "Demo Access" / "Quick Preview" surface for Login — a single
 * quiet trigger row that expands into the Patient/Doctor demo accounts
 * (public, intentionally-shared preview credentials — see
 * data/demoAccounts.js). Expansion is entirely local state (`expanded`),
 * never inherited from AuthCard's own one-time mount variants (see that
 * file's comment on why Auth route content must be self-contained) — this
 * is exactly the same "own local animation, no opacity:0-waiting-on-parent"
 * rule Login.jsx/Register.jsx already follow for their own entrance
 * animation, applied to a collapsible section instead of a page mount.
 *
 * `onUseDemo({ email, password })` is the ONLY way this ever touches
 * authentication — it hands the pair to Login's existing controlled
 * `form`/`setForm` state via a plain prop callback, the same as if the
 * fields had been typed by hand. This component never calls `login()`,
 * never touches AuthContext, never submits a form.
 */
const DemoAccess = ({ onUseDemo }) => {
  const { t } = useTranslation();
  const reducedMotion = prefersReducedMotion();
  const panelId = useId();

  const [expanded, setExpanded] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [announcement, setAnnouncement] = useState("");
  const copyTimeoutRef = useRef(null);

  useEffect(
    () => () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    },
    []
  );

  const handleCopy = async (key, value) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      return; // Clipboard API unavailable/denied — silently no-op, never alert().
    }

    setCopiedKey(key);
    setAnnouncement(t("auth.demo.copied"));
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => {
      setCopiedKey(null);
      setAnnouncement("");
    }, COPY_FEEDBACK_MS);
  };

  const renderAccount = (roleKey, account) => {
    const roleTitle = t(`auth.demo.${roleKey}.title`);
    return (
      <div className="demo-account-card" key={roleKey}>
        <div className="demo-account-header">
          <h3 className="demo-account-title">{roleTitle}</h3>
          <p className="demo-account-description">{t(`auth.demo.${roleKey}.description`)}</p>
        </div>

        <CredentialRow
          label={t("auth.demo.email")}
          value={account.email}
          copied={copiedKey === `${roleKey}-email`}
          onCopy={() => handleCopy(`${roleKey}-email`, account.email)}
          copyAriaLabel={t("auth.demo.copyEmailFor", { role: roleTitle })}
        />
        <CredentialRow
          label={t("auth.demo.password")}
          value={account.password}
          copied={copiedKey === `${roleKey}-password`}
          onCopy={() => handleCopy(`${roleKey}-password`, account.password)}
          copyAriaLabel={t("auth.demo.copyPasswordFor", { role: roleTitle })}
        />

        <button
          type="button"
          className="demo-use-account-btn"
          onClick={() => onUseDemo({ email: account.email, password: account.password })}
        >
          {t(roleKey === "patient" ? "auth.demo.usePatient" : "auth.demo.useDoctor")}
        </button>
      </div>
    );
  };

  return (
    <div className="demo-access">
      <button
        type="button"
        className="demo-access-trigger"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        aria-controls={panelId}
      >
        <span>{t("auth.demo.trigger")}</span>
        <LuChevronDown
          aria-hidden="true"
          className={`demo-access-chevron${expanded ? " demo-access-chevron--open" : ""}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={panelId}
            className="demo-access-panel"
            initial={reducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reducedMotion ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.22, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <div className="demo-access-panel-inner">
              {renderAccount("patient", DEMO_ACCOUNTS.patient)}
              {renderAccount("doctor", DEMO_ACCOUNTS.doctor)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <span aria-live="polite" className="visually-hidden">
        {announcement}
      </span>
    </div>
  );
};

export default DemoAccess;
