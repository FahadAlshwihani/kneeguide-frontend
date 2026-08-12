import React from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import Orb from "../../../../../components/ui/Orb";
import "./DoctorClinicalOrb.css";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Same tuned rotation patient/components/KneeGuideAssistantOrb.jsx already
// uses — this is KneeGuide's one brand Orb identity, not a second color
// treatment invented for Doctor. Kept as a small local copy (not imported)
// specifically BECAUSE that file also pulls in usePatientPreferences()
// (Patient's theme context, which Doctor doesn't have) — see this
// component's own file-level note in the final report for why a thin
// Doctor-owned wrapper around the shared, generic components/ui/Orb.jsx
// was built instead of reusing that wrapper directly.
const KNEEGUIDE_HUE = -50;

const STATE_CONFIG = {
  idle: { hoverIntensity: 0.15, forceHoverState: false },
  engaged: { hoverIntensity: 0.35, forceHoverState: true },
  success: { hoverIntensity: 0.45, forceHoverState: true },
};

// Doctor Home has no theme/appearance system (out of scope for this task —
// only Patient has one, see preferences/PatientPreferencesContext.jsx) —
// this matches the shell's own page background (`--color-background`,
// index.css :root, `.doctor-shell` in DoctorDashboardShell.css), for the
// same reason KneeGuideAssistantOrb.jsx matches --patient-surface-page:
// Orb.jsx blends its shader output by background luminance, so a
// mismatched value would show a visible box around the Orb instead of a
// seamless blend. Kept as a literal hex (not a CSS var lookup) since the
// shader needs a numeric value, not a custom property — see
// KneeGuideAssistantOrb.jsx's own identical reasoning for its light/dark
// pair.
const DOCTOR_ORB_BACKGROUND = "#050505";

/**
 * Doctor-specific semantic layer around the generic Orb primitive —
 * mirrors KneeGuideAssistantOrb.jsx's own "state name -> tuned shader
 * dial" mapping and `layout`-based large/compact resize, but is its own
 * component: own translation key, own fixed background, zero dependency
 * on Patient's preferences context. One Orb instance, two visual sizes,
 * zero re-inits — same WebGL mount-once guarantee Orb.jsx already
 * provides (this wrapper never keys/remounts it).
 */
const DoctorClinicalOrb = ({ state = "idle", size = "large", className = "" }) => {
  const { t } = useTranslation();
  const config = STATE_CONFIG[state] || STATE_CONFIG.idle;
  const reducedMotion = prefersReducedMotion();

  return (
    <motion.div
      layout
      transition={{ duration: reducedMotion ? 0 : 0.4, ease: [0.22, 0.61, 0.36, 1] }}
      className={`doctor-clinical-orb doctor-clinical-orb--${size} ${className}`.trim()}
      role="img"
      aria-label={t("doctorDashboard.assistant.orbLabel")}
    >
      <Orb
        hue={KNEEGUIDE_HUE}
        hoverIntensity={config.hoverIntensity}
        rotateOnHover
        forceHoverState={config.forceHoverState}
        backgroundColor={DOCTOR_ORB_BACKGROUND}
      />
    </motion.div>
  );
};

export default DoctorClinicalOrb;
