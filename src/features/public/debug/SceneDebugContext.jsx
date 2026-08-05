import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const DEFAULT_CONTROLS = {
  showBeams: true,
  showScene: true,
  showInvert: true,
  showFadeout: true,
  showSolution: true,
  showRadar: true,
  showSweep: true,
  showPulse: true,
  showHub: true,
  showTechnology: true,
  showPublicBackground: true,
  showSolutionPseudos: true,
  paintScene: false,
  paintPublicBackground: false,
  paintSolution: false,
  paintTechnology: false,
  paintPage: false,
  paintRadarClip: false,
  paintFadeLayer: false,
  pauseBeams: false,
  transparentCanvas: false,
  hideCanvas: false,
  disableCameraCrop: false,
  resetCompositing: false,
  integerCanvasBounds: false,
  removeMasks: false,
  removeBlendModes: false,
  removeSectionTransforms: false,
  removeNegativeOffsets: false,
  clearMode: "normal",
};

const CLASS_RULES = {
  showBeams: [false, "scene-debug--hide-beams"],
  showScene: [false, "scene-debug--hide-scene"],
  showInvert: [false, "scene-debug--hide-invert"],
  showFadeout: [false, "scene-debug--hide-fadeout"],
  showSolution: [false, "scene-debug--hide-solution"],
  showRadar: [false, "scene-debug--hide-radar"],
  showSweep: [false, "scene-debug--hide-sweep"],
  showPulse: [false, "scene-debug--hide-pulse"],
  showHub: [false, "scene-debug--hide-hub"],
  showTechnology: [false, "scene-debug--hide-technology"],
  showPublicBackground: [false, "scene-debug--hide-page-background"],
  showSolutionPseudos: [false, "scene-debug--hide-solution-pseudos"],
  paintScene: [true, "scene-debug--paint-scene"],
  paintPublicBackground: [true, "scene-debug--paint-public-background"],
  paintSolution: [true, "scene-debug--paint-solution"],
  paintTechnology: [true, "scene-debug--paint-technology"],
  paintPage: [true, "scene-debug--paint-page"],
  paintRadarClip: [true, "scene-debug--paint-radar-clip"],
  paintFadeLayer: [true, "scene-debug--paint-fade-layer"],
  transparentCanvas: [true, "scene-debug--transparent-canvas"],
  hideCanvas: [true, "scene-debug--hide-canvas"],
  resetCompositing: [true, "scene-debug--reset-compositing"],
  removeMasks: [true, "scene-debug--remove-masks"],
  removeBlendModes: [true, "scene-debug--remove-blends"],
  removeSectionTransforms: [true, "scene-debug--remove-section-transforms"],
  removeNegativeOffsets: [true, "scene-debug--remove-negative-offsets"],
};

const DEBUG_CLASSES = Object.values(CLASS_RULES).map(([, className]) => className);
const SceneDebugContext = createContext({ enabled: false, controls: DEFAULT_CONTROLS, setControl: () => {}, reset: () => {} });

const queryEnablesDebug = () => {
  if (process.env.NODE_ENV === "production" || typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("sceneDebug") === "1";
};

export const SceneDebugProvider = ({ children }) => {
  const [controls, setControls] = useState(DEFAULT_CONTROLS);
  const enabled = queryEnablesDebug();

  useEffect(() => {
    const root = document.documentElement;
    if (!enabled) return undefined;

    root.classList.add("scene-debug-active");
    DEBUG_CLASSES.forEach((className) => root.classList.remove(className));
    Object.entries(CLASS_RULES).forEach(([key, [activeValue, className]]) => {
      root.classList.toggle(className, controls[key] === activeValue);
    });

    return () => {
      root.classList.remove("scene-debug-active", ...DEBUG_CLASSES);
    };
  }, [controls, enabled]);

  useEffect(() => {
    if (!enabled || !controls.integerCanvasBounds) return undefined;
    const selectors = [".scene-background-layer", ".public-bg-root", ".beams-container", ".beams-container canvas", "canvas.beams-container"];
    const originals = new Map();

    const applyIntegerBounds = () => {
      selectors.forEach((selector) => {
        const element = document.querySelector(selector);
        if (!element) return;
        if (!originals.has(element)) originals.set(element, { width: element.style.width, height: element.style.height });
        const original = originals.get(element);
        element.style.width = original.width;
        element.style.height = original.height;
        const rect = element.getBoundingClientRect();
        element.style.width = `${Math.round(rect.width)}px`;
        element.style.height = `${Math.round(rect.height)}px`;
      });
    };

    applyIntegerBounds();
    window.addEventListener("resize", applyIntegerBounds);
    window.addEventListener("orientationchange", applyIntegerBounds);
    window.visualViewport?.addEventListener("resize", applyIntegerBounds);

    return () => {
      window.removeEventListener("resize", applyIntegerBounds);
      window.removeEventListener("orientationchange", applyIntegerBounds);
      window.visualViewport?.removeEventListener("resize", applyIntegerBounds);
      originals.forEach((value, element) => {
        element.style.width = value.width;
        element.style.height = value.height;
      });
    };
  }, [controls.integerCanvasBounds, enabled]);

  const value = useMemo(
    () => ({
      enabled,
      controls,
      setControl: (key, value) => setControls((current) => ({ ...current, [key]: value })),
      reset: () => setControls(DEFAULT_CONTROLS),
    }),
    [controls, enabled]
  );

  return <SceneDebugContext.Provider value={value}>{children}</SceneDebugContext.Provider>;
};

export const useSceneDebug = () => useContext(SceneDebugContext);
