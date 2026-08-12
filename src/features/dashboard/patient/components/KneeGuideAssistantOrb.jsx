import React from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import Orb from "../../../../components/ui/Orb";
import { usePatientPreferences } from "../preferences/PatientPreferencesContext";
import "./KneeGuideAssistantOrb.css";

// The Orb's shader takes a literal hex `backgroundColor` uniform (Orb.jsx
// blends it into the visual — see `bgLuminance`/`mix(darkCol, lightCol,
// bgLuminance)` in its fragment shader), not a CSS custom property, so it
// can't simply read `var(--patient-surface-page)` itself. These two values
// are intentionally kept in lockstep with `--patient-surface-page` in
// patientTokens.css's dark (default) and `[data-patient-theme="light"]`
// blocks respectively — audited first (Section 23): the shader already
// reacts to background luminance on its own, so light-mode contrast is
// solved by feeding it the correct page color, never by touching the
// shader/GLSL itself or mounting a second Orb/WebGL context.
const ORB_BACKGROUND_BY_THEME = {
  dark: "#050509",
  light: "#f8f8f8",
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// KneeGuide's own tuned hue rotation — the reference shader's three base
// colors are a violet (~hue 270), a cyan (~hue 195), and a deep blue
// (~hue 240). A single global rotation can't collapse all three onto one
// exact hue, but -50deg pulls the dominant violet/purple tone firmly into
// KneeGuide's blue family while the cyan shifts toward a cooler teal-blue
// — no rotation was chosen that introduces a warm/unrelated hue. Held
// constant across every semantic state below: state changes are conveyed
// through intensity/motion, never by shifting the brand's own color, which
// would read as inconsistent rather than "alive".
const KNEEGUIDE_HUE = -50;

// One dial (hoverIntensity + whether motion is forced) per semantic
// state — see Dock.jsx's own MotionValue-driven precedent for "state maps
// to a small number of tuned constants, not ad hoc values scattered at
// call sites". Only the states PatientHomeAssistant.jsx actually uses are
// implemented; THINKING is genuinely reserved for a future real async
// call (see that component), not used synchronously today.
const STATE_CONFIG = {
  idle: { hoverIntensity: 0.15, forceHoverState: false },
  engaged: { hoverIntensity: 0.35, forceHoverState: true },
  thinking: { hoverIntensity: 0.55, forceHoverState: true },
  success: { hoverIntensity: 0.45, forceHoverState: true },
};

/**
 * Patient-specific semantic layer around the generic Orb primitive
 * (components/ui/Orb.jsx, which knows nothing about KneeGuide, patients,
 * or rehabilitation). Callers pass a `state` — "idle" | "engaged" |
 * "thinking" | "success" — instead of touching shader uniforms directly.
 * `backgroundColor` defaults to the patient page surface token so the Orb
 * blends seamlessly into Patient Home rather than showing a visible box.
 *
 * `size` ("large" | "compact") toggles a CSS modifier class that changes
 * this wrapper's own width/height (KneeGuideAssistantOrb.css) — this is
 * the Welcome-to-Conversation shrink. The wrapper is a `motion.div` with
 * `layout` so that size (and any resulting position shift as surrounding
 * content collapses) animates smoothly via Motion's FLIP technique
 * instead of a raw width/height transition. Crucially, this NEVER touches
 * the <Orb/> instance itself or any of its props tied to WebGL setup —
 * the same canvas/renderer stays mounted throughout, only the box it
 * fills changes size, which Orb's own ResizeObserver already reacts to
 * (see Orb.jsx). One Orb instance, two visual sizes, zero re-inits.
 */
const KneeGuideAssistantOrb = ({ state = "idle", size = "large", className = "" }) => {
  const { t } = useTranslation();
  const { resolvedTheme } = usePatientPreferences();
  const config = STATE_CONFIG[state] || STATE_CONFIG.idle;
  const reducedMotion = prefersReducedMotion();

  return (
    <motion.div
      layout
      transition={{ duration: reducedMotion ? 0 : 0.4, ease: [0.22, 0.61, 0.36, 1] }}
      className={`kneeguide-assistant-orb kneeguide-assistant-orb--${size} ${className}`.trim()}
      // Decorative presence, not an interactive control or an image with
      // meaningful content — role="img" + a short label lets a screen
      // reader announce it once as context without exposing raw canvas
      // internals or forcing it to be silently skipped either.
      role="img"
      aria-label={t("patientDashboard.assistant.orbLabel")}
    >
      <Orb
        hue={KNEEGUIDE_HUE}
        hoverIntensity={config.hoverIntensity}
        rotateOnHover
        forceHoverState={config.forceHoverState}
        backgroundColor={ORB_BACKGROUND_BY_THEME[resolvedTheme] || ORB_BACKGROUND_BY_THEME.dark}
      />
    </motion.div>
  );
};

export default KneeGuideAssistantOrb;
