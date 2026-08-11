import React from "react";
import { useTranslation } from "react-i18next";
import Orb from "../../../../components/ui/Orb";
import "./KneeGuideAssistantOrb.css";

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
 */
const KneeGuideAssistantOrb = ({ state = "idle", className = "" }) => {
  const { t } = useTranslation();
  const config = STATE_CONFIG[state] || STATE_CONFIG.idle;

  return (
    <div
      className={`kneeguide-assistant-orb ${className}`.trim()}
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
        backgroundColor="#050509"
      />
    </div>
  );
};

export default KneeGuideAssistantOrb;
