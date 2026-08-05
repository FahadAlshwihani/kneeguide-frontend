import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSceneDebug } from "./SceneDebugContext";
import "./SceneDebug.css";

const rectFor = (selector) => {
  const element = document.querySelector(selector);
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top + window.scrollY,
    bottom: rect.bottom + window.scrollY,
    left: rect.left + window.scrollX,
    right: rect.right + window.scrollX,
    height: rect.height,
    width: rect.width,
  };
};

const round = (value) => (Number.isFinite(value) ? Math.round(value * 1000) / 1000 : null);
const formatRect = (rect) => (rect ? `t ${round(rect.top)} · b ${round(rect.bottom)} · h ${round(rect.height)}` : "missing");

const elementLabel = (element) => {
  if (!element) return "";
  const id = element.id ? `#${element.id}` : "";
  const classes = typeof element.className === "string" && element.className.trim()
    ? `.${element.className.trim().split(/\s+/).slice(0, 3).join(".")}`
    : "";
  return `${element.tagName.toLowerCase()}${id}${classes}`;
};

const mediaState = () => {
  const tests = [
    ["hover:hover", "(hover: hover)"], ["hover:none", "(hover: none)"],
    ["pointer:fine", "(pointer: fine)"], ["pointer:coarse", "(pointer: coarse)"],
    ["any-pointer:fine", "(any-pointer: fine)"], ["any-pointer:coarse", "(any-pointer: coarse)"],
    ["portrait", "(orientation: portrait)"], ["landscape", "(orientation: landscape)"],
    ["aspect≥4/3", "(min-aspect-ratio: 4/3)"], ["aspect≤3/4", "(max-aspect-ratio: 3/4)"],
    ["DPR≥2", "(min-resolution: 2dppx)"], ["DPR≥1.5", "(min-resolution: 1.5dppx)"],
    ["reduced-motion", "(prefers-reduced-motion: reduce)"],
    ["standalone", "(display-mode: standalone)"],
    ["height≤700", "(max-height: 700px)"], ["height≤900", "(max-height: 900px)"],
    ["height≥1000", "(min-height: 1000px)"],
  ];
  return tests.map(([label, query]) => `${label}:${window.matchMedia(query).matches ? "Y" : "N"}`).join(" · ");
};

const responsiveTier = () => {
  const width = window.innerWidth;
  const radar = width < 641 ? "mobile" : width < 1024 ? "tablet" : width < 1280 ? "laptop" : "desktop";
  const solutionFlow = width <= 1023 ? "in-flow map" : "absolute map";
  return `${radar} / ${solutionFlow} / ${width <= 768 ? "mobile header" : "desktop header"}`;
};

const makeSnapshot = () => {
  const viewport = window.visualViewport;
  const scene = rectFor(".hero-problem-scene");
  const background = rectFor(".public-bg-root");
  const solution = rectFor(".solution-root");
  const radar = rectFor(".platform-radar-clip");
  const technology = rectFor(".tech-root");
  const hubElement = document.querySelector("body > .platform-hub");
  const hubRect = hubElement?.getBoundingClientRect();
  const canvas = document.querySelector(".beams-container canvas, canvas.beams-container");
  const canvasRect = canvas?.getBoundingClientRect();
  const map = rectFor(".solution-map");
  const boundaryViewportY = document.querySelector(".tech-root")?.getBoundingClientRect().top;
  const xs = [0.1, 0.25, 0.5, 0.75, 0.9];
  const ys = [-2, -1, 0, 1, 2];
  const hitTests = [];

  if (Number.isFinite(boundaryViewportY)) {
    const panel = document.querySelector(".scene-debug-panel");
    const previousPanelVisibility = panel?.style.visibility ?? "";
    if (panel) panel.style.visibility = "hidden";
    ys.forEach((offset) => {
      xs.forEach((fraction) => {
        const x = Math.round(window.innerWidth * fraction);
        const y = boundaryViewportY + offset;
        const stack = y >= 0 && y <= window.innerHeight
          ? document.elementsFromPoint(x, y).slice(0, 8).map(elementLabel)
          : ["seam outside visual viewport"];
        hitTests.push({ x: `${Math.round(fraction * 100)}%`, y: `${offset >= 0 ? "+" : ""}${offset}`, stack });
      });
    });
    if (panel) panel.style.visibility = previousPanelVisibility;
  }

  const pseudo = ["::before", "::after"].map((part) => {
    const element = document.querySelector(".solution-root");
    if (!element) return `${part}:missing`;
    const style = getComputedStyle(element, part);
    return `${part}:${style.content} / ${style.display} / ${style.position}`;
  });

  const hubCenterY = hubRect ? hubRect.top + window.scrollY + hubRect.height / 2 : null;
  return {
    time: new Date().toISOString(),
    language: document.documentElement.lang || document.body.className,
    direction: document.documentElement.dir || getComputedStyle(document.documentElement).direction,
    viewport: {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      visualWidth: viewport?.width ?? null,
      visualHeight: viewport?.height ?? null,
      visualOffsetTop: viewport?.offsetTop ?? null,
      visualScale: viewport?.scale ?? null,
      clientWidth: document.documentElement.clientWidth,
    },
    tier: responsiveTier(),
    media: mediaState(),
    scene,
    background,
    solution,
    radar,
    map,
    technology,
    hub: hubRect ? {
      top: hubRect.top + window.scrollY,
      bottom: hubRect.bottom + window.scrollY,
      centerY: hubCenterY,
      portalX: parseFloat(getComputedStyle(hubElement).getPropertyValue("--node-x")) || null,
      portalY: parseFloat(getComputedStyle(hubElement).getPropertyValue("--node-y")) || null,
    } : null,
    radarOrigin: map ? { x: map.left + map.width / 2, y: map.bottom } : null,
    gap: solution && technology ? technology.top - solution.bottom : null,
    canvas: canvasRect ? {
      cssWidth: canvasRect.width,
      cssHeight: canvasRect.height,
      backingWidth: canvas.width,
      backingHeight: canvas.height,
    } : null,
    pseudo,
    hitTests,
  };
};

const Toggle = ({ label, control, controls, setControl }) => (
  <label className="scene-debug-toggle">
    <input type="checkbox" checked={Boolean(controls[control])} onChange={(event) => setControl(control, event.target.checked)} />
    <span>{label}</span>
  </label>
);

const SceneDebugPanel = () => {
  const { enabled, controls, setControl, reset } = useSceneDebug();
  const { i18n } = useTranslation();
  const [snapshot, setSnapshot] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [copyStatus, setCopyStatus] = useState("Copy report");
  const frameRef = useRef(null);

  const update = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      setSnapshot(makeSnapshot());
      frameRef.current = null;
    });
  }, []);

  useLayoutEffect(() => {
    if (!enabled) return undefined;
    update();
    const resizeObserver = new ResizeObserver(update);
    [".public-root", ".hero-problem-scene", ".public-bg-root", ".solution-root", ".solution-map", ".platform-radar-clip", ".tech-root", "body > .platform-hub"]
      .forEach((selector) => {
        const element = document.querySelector(selector);
        if (element) resizeObserver.observe(element);
      });
    const events = [[window, "resize"], [window, "orientationchange"], [window, "scroll"]];
    events.forEach(([target, name]) => target.addEventListener(name, update, { passive: true }));
    window.visualViewport?.addEventListener("resize", update, { passive: true });
    window.visualViewport?.addEventListener("scroll", update, { passive: true });
    document.fonts?.addEventListener?.("loadingdone", update);
    return () => {
      resizeObserver.disconnect();
      events.forEach(([target, name]) => target.removeEventListener(name, update));
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
      document.fonts?.removeEventListener?.("loadingdone", update);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [enabled, i18n.language, update]);

  useEffect(() => { if (enabled) update(); }, [controls, enabled, update]);

  const report = useMemo(() => (snapshot ? JSON.stringify({ controls, snapshot }, null, 2) : "Waiting for measurements…"), [controls, snapshot]);
  if (!enabled) return null;

  const jumpToSeam = () => {
    const top = document.querySelector(".tech-root")?.getBoundingClientRect().top;
    if (Number.isFinite(top)) window.scrollBy({ top: top - window.innerHeight * 0.55, behavior: "auto" });
  };

  const copyReport = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(report);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = report;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }
      setCopyStatus("Copied");
      window.setTimeout(() => setCopyStatus("Copy report"), 1200);
    } catch {
      setCopyStatus("Select raw report");
    }
  };

  return (
    <aside className={`scene-debug-panel${collapsed ? " is-collapsed" : ""}`} dir="ltr" aria-label="Scene diagnostics">
      <header className="scene-debug-header">
        <strong>Scene Debug · real device</strong>
        <button type="button" onClick={() => setCollapsed((value) => !value)}>{collapsed ? "Open" : "Collapse"}</button>
      </header>
      {!collapsed && snapshot && (
        <div className="scene-debug-body">
          <div className="scene-debug-actions">
            <button type="button" onClick={jumpToSeam}>Jump to seam</button>
            <button type="button" onClick={update}>Refresh</button>
            <button type="button" onClick={copyReport}>{copyStatus}</button>
            <button type="button" onClick={reset}>Reset toggles</button>
          </div>

          <section><h3>Viewport</h3><pre>{`inner ${snapshot.viewport.innerWidth}×${snapshot.viewport.innerHeight} · DPR ${snapshot.viewport.devicePixelRatio}\nvisual ${round(snapshot.viewport.visualWidth)}×${round(snapshot.viewport.visualHeight)} · top ${round(snapshot.viewport.visualOffsetTop)} · scale ${snapshot.viewport.visualScale}\nclientWidth ${snapshot.viewport.clientWidth}\n${snapshot.language}/${snapshot.direction} · ${snapshot.tier}\n${snapshot.media}`}</pre></section>
          <section><h3>Geometry (document px)</h3><pre>{`scene ${formatRect(snapshot.scene)}\nPublicBackground ${formatRect(snapshot.background)}\nSolution ${formatRect(snapshot.solution)}\nradar clip ${formatRect(snapshot.radar)}\nTechnology ${formatRect(snapshot.technology)}\ngap Tech.top−Solution.bottom = ${round(snapshot.gap)}\nhub ${snapshot.hub ? `t ${round(snapshot.hub.top)} · b ${round(snapshot.hub.bottom)} · center ${round(snapshot.hub.centerY)} · portal (${round(snapshot.hub.portalX)}, ${round(snapshot.hub.portalY)})` : "missing"}\nradar origin ${snapshot.radarOrigin ? `(${round(snapshot.radarOrigin.x)}, ${round(snapshot.radarOrigin.y)})` : "missing"}\ncanvas ${snapshot.canvas ? `CSS ${round(snapshot.canvas.cssWidth)}×${round(snapshot.canvas.cssHeight)} · buffer ${snapshot.canvas.backingWidth}×${snapshot.canvas.backingHeight}` : "missing/fallback"}`}</pre></section>

          <section><h3>Layer visibility</h3><div className="scene-debug-grid">
            <Toggle label="Beams wrapper" control="showBeams" {...{ controls, setControl }} /><Toggle label="HeroProblemScene" control="showScene" {...{ controls, setControl }} />
            <Toggle label="invert-lighten" control="showInvert" {...{ controls, setControl }} /><Toggle label="beam-fadeout" control="showFadeout" {...{ controls, setControl }} />
            <Toggle label="Solution root" control="showSolution" {...{ controls, setControl }} /><Toggle label="radar SVG" control="showRadar" {...{ controls, setControl }} />
            <Toggle label="radar sweep" control="showSweep" {...{ controls, setControl }} /><Toggle label="radar pulse" control="showPulse" {...{ controls, setControl }} />
            <Toggle label="hub portal" control="showHub" {...{ controls, setControl }} /><Toggle label="Technology root" control="showTechnology" {...{ controls, setControl }} />
            <Toggle label="public/body bg" control="showPublicBackground" {...{ controls, setControl }} /><Toggle label="Solution pseudos" control="showSolutionPseudos" {...{ controls, setControl }} />
          </div></section>

          <section><h3>Solid ownership colors</h3><div className="scene-debug-grid">
            <Toggle label="Scene red" control="paintScene" {...{ controls, setControl }} /><Toggle label="PublicBackground magenta" control="paintPublicBackground" {...{ controls, setControl }} />
            <Toggle label="Solution green" control="paintSolution" {...{ controls, setControl }} /><Toggle label="Technology blue" control="paintTechnology" {...{ controls, setControl }} />
            <Toggle label="Page/body yellow" control="paintPage" {...{ controls, setControl }} /><Toggle label="radar clip cyan" control="paintRadarClip" {...{ controls, setControl }} />
            <Toggle label="fade layer orange" control="paintFadeLayer" {...{ controls, setControl }} />
          </div></section>

          <section><h3>Canvas/WebGL isolation</h3><div className="scene-debug-grid">
            <Toggle label="Pause frameloop" control="pauseBeams" {...{ controls, setControl }} /><Toggle label="Canvas opacity 0" control="transparentCanvas" {...{ controls, setControl }} />
            <Toggle label="Canvas visibility hidden" control="hideCanvas" {...{ controls, setControl }} /><Toggle label="Disable camera crop" control="disableCameraCrop" {...{ controls, setControl }} />
            <Toggle label="Reset compositing CSS" control="resetCompositing" {...{ controls, setControl }} /><Toggle label="Integer canvas bounds" control="integerCanvasBounds" {...{ controls, setControl }} />
          </div><label className="scene-debug-select">Renderer clear <select value={controls.clearMode} onChange={(event) => setControl("clearMode", event.target.value)}><option value="normal">Normal black</option><option value="transparent">Alpha 0</option><option value="bright">Bright lime</option></select></label></section>

          <section><h3>Section-paint isolation</h3><div className="scene-debug-grid">
            <Toggle label="Remove masks" control="removeMasks" {...{ controls, setControl }} /><Toggle label="Remove blend modes" control="removeBlendModes" {...{ controls, setControl }} />
            <Toggle label="Remove section transforms" control="removeSectionTransforms" {...{ controls, setControl }} /><Toggle label="Remove negative offsets" control="removeNegativeOffsets" {...{ controls, setControl }} />
          </div><pre>{snapshot.pseudo.join("\n")}</pre></section>

          <section><h3>elementsFromPoint at seam</h3><div className="scene-debug-hit-tests">{snapshot.hitTests.map((test) => <div key={`${test.x}-${test.y}`}><b>{test.x} / {test.y}px</b><span>{test.stack.join(" › ")}</span></div>)}</div></section>
          <details><summary>Raw report</summary><pre className="scene-debug-report">{report}</pre></details>
        </div>
      )}
    </aside>
  );
};

export default SceneDebugPanel;
