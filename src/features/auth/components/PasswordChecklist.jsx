import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { LuCheck, LuCircle, LuX } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { getPasswordRequirements } from "../utils/passwordRequirements";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const REQUIREMENT_KEYS = ["minLength", "uppercase", "lowercase", "number", "special"];

// Fixed-size icon slot (CSS: .password-requirement-icon) — swapping
// LuCircle/LuCheck/LuX never changes the slot's own dimensions, so a
// requirement flipping state never shifts anything around it. `mode=
// "wait"` is safe here (unlike the Login<->Register route transition
// this app fixed before): this only ever swaps a local, always-mounted
// icon element, nothing here is `<Outlet/>` or route-owned.
const RequirementIcon = ({ status, reducedMotion }) => {
  const Icon = status === "met" ? LuCheck : status === "unmet" ? LuX : LuCircle;

  return (
    <span className="password-requirement-icon">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={status}
          initial={reducedMotion ? false : { opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reducedMotion ? undefined : { opacity: 0, scale: 0.8 }}
          transition={{ duration: reducedMotion ? 0 : 0.15, ease: "easeOut" }}
        >
          <Icon aria-hidden="true" />
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

/**
 * Live password-requirement feedback for Register's password step — pure
 * presentation over `getPasswordRequirements` (utils/passwordRequirements.js),
 * the SAME derivation Register.jsx's own validateStep gate uses, so this
 * can never show a requirement as met that the actual gate would still
 * reject. Feedback only, not the security boundary — Continue is still
 * blocked by that gate regardless of what this displays.
 *
 * No `aria-live` on the list itself, deliberately — with five items
 * re-evaluating on every keystroke, a live region here would announce
 * the whole list repeatedly while typing. Each row's own `aria-label`
 * carries its current state instead, so a screen reader user who
 * navigates to the list on demand still gets accurate state, without the
 * noise of an automatic per-keystroke announcement.
 */
const PasswordChecklist = ({ password }) => {
  const { t } = useTranslation();
  const reducedMotion = prefersReducedMotion();
  const requirements = getPasswordRequirements(password);
  const touched = password.length > 0;

  return (
    <ul className="password-checklist">
      {REQUIREMENT_KEYS.map((key) => {
        const status = !touched ? "neutral" : requirements[key] ? "met" : "unmet";
        const label = t(`register.passwordChecklist.${key}`);
        const statusLabel =
          status === "met"
            ? t("register.passwordChecklist.metStatus")
            : status === "unmet"
              ? t("register.passwordChecklist.unmetStatus")
              : "";

        return (
          <li
            key={key}
            className={`password-requirement password-requirement--${status}`}
            aria-label={statusLabel ? `${label}: ${statusLabel}` : label}
          >
            <RequirementIcon status={status} reducedMotion={reducedMotion} />
            <span className="password-requirement-text" aria-hidden="true">
              {label}
            </span>
          </li>
        );
      })}
    </ul>
  );
};

/**
 * The one compact confirm-password status row — hidden entirely until the
 * user actually types something into Confirm Password (never shown for
 * an untouched/empty field). `aria-live="polite"` here (unlike the
 * checklist above) is deliberate: this is a single row, not five, and it
 * only changes when there's something genuinely worth confirming — low
 * enough frequency that announcing it is useful signal, not noise.
 * Re-derives from the live `password`/`confirmPassword` values on every
 * render, so editing the original password after confirmation already
 * matched immediately flips this back to a mismatch if they now differ.
 */
export const PasswordMatchStatus = ({ password, confirmPassword }) => {
  const { t } = useTranslation();
  const reducedMotion = prefersReducedMotion();

  if (!confirmPassword) return null;

  const matches = password === confirmPassword;
  const status = matches ? "met" : "unmet";

  return (
    <div className={`password-match-status password-match-status--${status}`} aria-live="polite">
      <RequirementIcon status={status} reducedMotion={reducedMotion} />
      <span>{t(`register.passwordChecklist.${matches ? "match" : "mismatch"}`)}</span>
    </div>
  );
};

export default PasswordChecklist;
