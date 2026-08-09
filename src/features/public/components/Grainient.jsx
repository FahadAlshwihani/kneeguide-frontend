import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle } from "ogl";
import { getDprForTier, subscribePerformanceTier } from "../performance/performanceTier";
import "./Grainient.css";

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [1, 1, 1];
  return [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255];
};

const vertex = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uTimeSpeed;
uniform float uColorBalance;
uniform float uWarpStrength;
uniform float uWarpFrequency;
uniform float uWarpSpeed;
uniform float uWarpAmplitude;
uniform float uBlendAngle;
uniform float uBlendSoftness;
uniform float uRotationAmount;
uniform float uNoiseScale;
uniform float uGrainAmount;
uniform float uGrainScale;
uniform float uGrainAnimated;
uniform float uContrast;
uniform float uGamma;
uniform float uSaturation;
uniform vec2 uCenterOffset;
uniform float uZoom;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
out vec4 fragColor;
#define S(a,b,t) smoothstep(a,b,t)
mat2 Rot(float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c);}
vec2 hash(vec2 p){p=vec2(dot(p,vec2(2127.1,81.17)),dot(p,vec2(1269.5,283.37)));return fract(sin(p)*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);float n=mix(mix(dot(-1.0+2.0*hash(i+vec2(0.0,0.0)),f-vec2(0.0,0.0)),dot(-1.0+2.0*hash(i+vec2(1.0,0.0)),f-vec2(1.0,0.0)),u.x),mix(dot(-1.0+2.0*hash(i+vec2(0.0,1.0)),f-vec2(0.0,1.0)),dot(-1.0+2.0*hash(i+vec2(1.0,1.0)),f-vec2(1.0,1.0)),u.x),u.y);return 0.5+0.5*n;}
void mainImage(out vec4 o, vec2 C){
  float t=iTime*uTimeSpeed;
  vec2 uv=C/iResolution.xy;
  float ratio=iResolution.x/iResolution.y;
  vec2 tuv=uv-0.5+uCenterOffset;
  tuv/=max(uZoom,0.001);

  float degree=noise(vec2(t*0.1,tuv.x*tuv.y)*uNoiseScale);
  tuv.y*=1.0/ratio;
  tuv*=Rot(radians((degree-0.5)*uRotationAmount+180.0));
  tuv.y*=ratio;

  float frequency=uWarpFrequency;
  float ws=max(uWarpStrength,0.001);
  float amplitude=uWarpAmplitude/ws;
  float warpTime=t*uWarpSpeed;
  tuv.x+=sin(tuv.y*frequency+warpTime)/amplitude;
  tuv.y+=sin(tuv.x*(frequency*1.5)+warpTime)/(amplitude*0.5);

  vec3 colLav=uColor1;
  vec3 colOrg=uColor2;
  vec3 colDark=uColor3;
  float b=uColorBalance;
  float s=max(uBlendSoftness,0.0);
  mat2 blendRot=Rot(radians(uBlendAngle));
  float blendX=(tuv*blendRot).x;
  float edge0=-0.3-b-s;
  float edge1=0.2-b+s;
  float v0=0.5-b+s;
  float v1=-0.3-b-s;
  vec3 layer1=mix(colDark,colOrg,S(edge0,edge1,blendX));
  vec3 layer2=mix(colOrg,colLav,S(edge0,edge1,blendX));
  vec3 col=mix(layer1,layer2,S(v0,v1,tuv.y));

  vec2 grainUv=uv*max(uGrainScale,0.001);
  if(uGrainAnimated>0.5){grainUv+=vec2(iTime*0.05);}
  float grain=fract(sin(dot(grainUv,vec2(12.9898,78.233)))*43758.5453);
  col+=(grain-0.5)*uGrainAmount;

  col=(col-0.5)*uContrast+0.5;
  float luma=dot(col,vec3(0.2126,0.7152,0.0722));
  col=mix(vec3(luma),col,uSaturation);
  col=pow(max(col,0.0),vec3(1.0/max(uGamma,0.001)));
  col=clamp(col,0.0,1.0);

  o=vec4(col,1.0);
}
void main(){
  vec4 o=vec4(0.0);
  mainImage(o,gl_FragCoord.xy);
  fragColor=o;
}
`;

// Keep renderer/program alive across re-renders so Effect 2 can update
// uniforms without ever rebuilding the WebGL context.
const ctxMap = new WeakMap();

const REDUCED_MOTION_FACTOR = 0.2;
const BLEND_EASE = 0.08;

// t*t*(3-2t) — cheap smoothstep, used only to ease the region-blend curve
// at its own start/end, nothing shader-related.
const smoothstep01 = (t) => t * t * (3 - 2 * t);

const Grainient = ({
  timeSpeed = 0.25,
  colorBalance = 0.0,
  warpStrength = 1.0,
  warpFrequency = 5.0,
  warpSpeed = 2.0,
  warpAmplitude = 50.0,
  blendAngle = 0.0,
  blendSoftness = 0.05,
  rotationAmount = 500.0,
  noiseScale = 2.0,
  grainAmount = 0.1,
  grainScale = 2.0,
  grainAnimated = false,
  contrast = 1.5,
  gamma = 1.0,
  saturation = 1.0,
  centerX = 0.0,
  centerY = 0.0,
  zoom = 0.9,
  color1 = "#FF9FFC",
  color2 = "#5227FF",
  color3 = "#B497CF",
  // Optional second palette this canvas eases toward as the page scrolls
  // *away* from `regionBoundarySelector`'s element (see below) — default
  // to the main palette itself, which makes the blend a no-op and this
  // component behave exactly as a single-palette Grainient, unchanged,
  // when a caller doesn't opt in.
  heroColor1 = color1,
  heroColor2 = color2,
  heroColor3 = color3,
  // A CSS selector for the element whose own top/bottom edge marks the
  // hero->main transition zone (blend 0 above its top, 1 below its
  // bottom, eased in between) — real, measured DOM geometry, never a
  // hardcoded scrollY value. `null` (default) disables blending: the
  // canvas just renders the main palette everywhere, same as before this
  // prop existed.
  regionBoundarySelector = null,
  className = "",
}) => {
  const containerRef = useRef(null);

  // Effect 1: build WebGL context once. Lifecycle is intentionally the
  // simplest correct model now that this is the page's only WebGL
  // background: `shouldRun` == page-visible. There is no more "offscreen"
  // state worth guarding against with an IntersectionObserver — this
  // canvas visually spans the whole homepage, so section-level visibility
  // was already a near no-op, and there is no second canvas left to pause
  // for.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    let renderer;
    let gl;
    let canvas;
    let program;
    let mesh;

    try {
      renderer = new Renderer({
        webgl: 2,
        alpha: true,
        antialias: false,
        dpr: getDprForTier(),
      });
      gl = renderer.gl;
      canvas = gl.canvas;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.display = "block";
      container.appendChild(canvas);

      const geometry = new Triangle(gl);
      program = new Program(gl, {
        vertex,
        fragment,
        uniforms: {
          iTime: { value: 0 },
          iResolution: { value: new Float32Array([1, 1]) },
          uTimeSpeed: { value: 0.25 },
          uColorBalance: { value: 0.0 },
          uWarpStrength: { value: 1.0 },
          uWarpFrequency: { value: 5.0 },
          uWarpSpeed: { value: 2.0 },
          uWarpAmplitude: { value: 50.0 },
          uBlendAngle: { value: 0.0 },
          uBlendSoftness: { value: 0.05 },
          uRotationAmount: { value: 500.0 },
          uNoiseScale: { value: 2.0 },
          uGrainAmount: { value: 0.1 },
          uGrainScale: { value: 2.0 },
          uGrainAnimated: { value: 0.0 },
          uContrast: { value: 1.5 },
          uGamma: { value: 1.0 },
          uSaturation: { value: 1.0 },
          uCenterOffset: { value: new Float32Array([0, 0]) },
          uZoom: { value: 0.9 },
          uColor1: { value: new Float32Array([1, 1, 1]) },
          uColor2: { value: new Float32Array([1, 1, 1]) },
          uColor3: { value: new Float32Array([1, 1, 1]) },
        },
      });
      mesh = new Mesh(gl, { geometry, program });
    } catch {
      // WebGL2/OGL genuinely failed to initialize (unsupported browser,
      // context creation refused, shader compile failure) — a cheap
      // static fallback using the approved palette's own darkest tone, so
      // the page never goes blank. This is NOT a low-end-device path;
      // low performance tiers still get the real animated canvas below.
      container.style.background = color2;
      return undefined;
    }

    const ctx = { renderer, program, mesh };
    ctxMap.set(container, ctx);

    const setSize = () => {
      const rect = container.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      renderer.setSize(w, h);
      const res = program.uniforms.iResolution.value;
      res[0] = gl.drawingBufferWidth;
      res[1] = gl.drawingBufferHeight;
      renderer.render({ scene: mesh });
    };

    // The container is now viewport-bound (position: fixed; height:
    // 100svh — see SiteBackground.css) rather than document-tall, so its
    // rendered size should only actually change on a real resize/
    // orientation change. `100svh` alone should already keep mobile
    // scroll-driven browser-chrome show/hide from firing this at all, but
    // debouncing here is a cheap second line of defense against any
    // residual ResizeObserver churn — coalesces a burst of firings (e.g.
    // a dragged window resize, or a toolbar mid-transition) into a single
    // `setSize()` call once things settle, rather than resizing the
    // renderer on every intermediate frame.
    let resizeTimeout = null;
    const scheduleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(setSize, 120);
    };

    const ro = new ResizeObserver(scheduleResize);
    ro.observe(container);
    setSize(); // immediate first size — no debounce delay before the first frame

    // Distinct from performance tier: prefers-reduced-motion means "calmer
    // motion", not "weaker device" (a slow device still gets the real,
    // full-speed animation, just at a lower DPR — see performanceTier.js).
    // Scales the *speed* uniforms rather than stopping them, so the
    // background stays visibly alive rather than freezing outright.
    const reducedMotionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let reducedMotion = reducedMotionQuery?.matches ?? false;

    ctx.baseTimeSpeed = timeSpeed;
    ctx.baseWarpSpeed = warpSpeed;
    const applySpeedUniforms = () => {
      const factor = reducedMotion ? REDUCED_MOTION_FACTOR : 1;
      program.uniforms.uTimeSpeed.value = ctx.baseTimeSpeed * factor;
      program.uniforms.uWarpSpeed.value = ctx.baseWarpSpeed * factor;
    };
    ctx.applySpeedUniforms = applySpeedUniforms;
    applySpeedUniforms();

    const onReducedMotionChange = (e) => {
      reducedMotion = e.matches;
      applySpeedUniforms();
    };
    reducedMotionQuery?.addEventListener?.("change", onReducedMotionChange);

    // Converted to normalized RGB once here (and again in Effect 2 on
    // prop change) — never re-parsed inside the RAF loop below.
    ctx.heroRgb = [hexToRgb(heroColor1), hexToRgb(heroColor2), hexToRgb(heroColor3)];
    ctx.mainRgb = [hexToRgb(color1), hexToRgb(color2), hexToRgb(color3)];

    // Real, measured geometry for the region-blend curve — never a
    // hardcoded scrollY. `boundaryEl`'s own top/bottom edge (document-
    // relative, i.e. viewport-relative + current scroll, so it stays
    // correct at any scroll position) mark where the blend starts easing
    // away from the hero palette and where it finishes at the main one.
    // Re-measured on the element's own resize (language reflow, viewport
    // resize, orientation change) — never on scroll, since scroll alone
    // can't change a document-relative position.
    let heroTopDocY = 0;
    let heroBottomDocY = 0;
    let hasBoundary = false;
    let boundaryRo = null;

    if (regionBoundarySelector) {
      const boundaryEl = document.querySelector(regionBoundarySelector);
      if (boundaryEl) {
        const measureBoundary = () => {
          const rect = boundaryEl.getBoundingClientRect();
          heroTopDocY = rect.top + window.scrollY;
          heroBottomDocY = rect.bottom + window.scrollY;
          hasBoundary = true;
        };
        measureBoundary();
        if (typeof ResizeObserver !== "undefined") {
          boundaryRo = new ResizeObserver(measureBoundary);
          boundaryRo.observe(boundaryEl);
        }
      }
    }

    const computeTargetBlend = () => {
      if (!hasBoundary) return 1;
      const span = heroBottomDocY - heroTopDocY;
      if (span <= 0) return 1;
      const raw = (window.scrollY - heroTopDocY) / span;
      return smoothstep01(Math.min(1, Math.max(0, raw)));
    };

    // Starts at the correct value for the current scroll position — never
    // an initial 0/1 that has to visibly catch up over the first frames.
    let currentBlend = computeTargetBlend();

    let rafId = null;
    let pageVisible = !document.hidden;
    const t0 = performance.now();

    const shouldRun = () => pageVisible;

    const setDevActive = (value) => {
      if (process.env.NODE_ENV === "production" || typeof window === "undefined") return;
      window.__KG_PERF__ = window.__KG_PERF__ || {};
      window.__KG_PERF__.grainientActive = value;
    };

    // The entire per-frame cost: one scrollY read (cheap, never forces
    // layout), a few arithmetic ops to ease the blend and mix two cached
    // palettes into the existing uColor* Float32Arrays IN PLACE (no
    // allocation), then a single render call. iTime advances from wall
    // clock alone — scroll only ever feeds `computeTargetBlend`, never
    // `iTime` itself, so the pattern keeps animating even if scrollY
    // never changes again after this frame.
    const renderFrame = (t) => {
      if (!shouldRun()) {
        rafId = null;
        setDevActive(false);
        return;
      }

      program.uniforms.iTime.value = (t - t0) * 0.001;

      const targetBlend = computeTargetBlend();
      currentBlend += (targetBlend - currentBlend) * BLEND_EASE;

      const [hero1, hero2, hero3] = ctx.heroRgb;
      const [main1, main2, main3] = ctx.mainRgb;
      const c1 = program.uniforms.uColor1.value;
      const c2 = program.uniforms.uColor2.value;
      const c3 = program.uniforms.uColor3.value;
      for (let i = 0; i < 3; i++) {
        c1[i] = hero1[i] + (main1[i] - hero1[i]) * currentBlend;
        c2[i] = hero2[i] + (main2[i] - hero2[i]) * currentBlend;
        c3[i] = hero3[i] + (main3[i] - hero3[i]) * currentBlend;
      }

      renderer.render({ scene: mesh });
      rafId = requestAnimationFrame(renderFrame);
    };

    const startLoop = () => {
      if (rafId !== null) return; // already scheduled — never a second loop
      rafId = requestAnimationFrame(renderFrame);
      setDevActive(true);
    };
    const stopLoop = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      setDevActive(false);
    };
    const syncLoopState = () => (shouldRun() ? startLoop() : stopLoop());

    const onVisibility = () => {
      pageVisible = !document.hidden;
      syncLoopState();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Downgrade-only, at most once per session (see performanceTier.js) —
    // resizes the existing renderer/backing-store in place, never
    // recreates the Renderer/Program/Mesh built above.
    const unsubscribeTier = subscribePerformanceTier((tier) => {
      renderer.dpr = getDprForTier(tier);
      setSize();
    });

    syncLoopState();

    return () => {
      stopLoop();
      clearTimeout(resizeTimeout);
      ro.disconnect();
      boundaryRo?.disconnect();
      reducedMotionQuery?.removeEventListener?.("change", onReducedMotionChange);
      unsubscribeTier();
      document.removeEventListener("visibilitychange", onVisibility);
      ctxMap.delete(container);
      try {
        container.removeChild(canvas);
      } catch {
        /* ignore */
      }
    };
    // Mount-once by design (WebGL context built exactly once) — props
    // referenced above are intentionally only read for their initial
    // values; Effect 2 below keeps everything they feed in sync on
    // subsequent changes without ever rebuilding the renderer/program.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect 2: sync props to uniforms — zero GPU cost, no teardown.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ctx = ctxMap.get(container);
    if (!ctx) return;
    const { program } = ctx;
    const u = program.uniforms;

    ctx.baseTimeSpeed = timeSpeed;
    ctx.baseWarpSpeed = warpSpeed;
    ctx.applySpeedUniforms?.();

    u.uColorBalance.value = colorBalance;
    u.uWarpStrength.value = warpStrength;
    u.uWarpFrequency.value = warpFrequency;
    u.uWarpAmplitude.value = warpAmplitude;
    u.uBlendAngle.value = blendAngle;
    u.uBlendSoftness.value = blendSoftness;
    u.uRotationAmount.value = rotationAmount;
    u.uNoiseScale.value = noiseScale;
    u.uGrainAmount.value = grainAmount;
    u.uGrainScale.value = grainScale;
    u.uGrainAnimated.value = grainAnimated ? 1.0 : 0.0;
    u.uContrast.value = contrast;
    u.uGamma.value = gamma;
    u.uSaturation.value = saturation;
    u.uCenterOffset.value = new Float32Array([centerX, centerY]);
    u.uZoom.value = zoom;

    // uColor1/2/3 are driven every frame by the RAF loop's hero/main blend
    // (see Effect 1) — this only refreshes the two CACHED palettes it
    // blends between, never assigns the color uniforms directly (that
    // would fight the RAF loop's own per-frame writes).
    ctx.heroRgb = [hexToRgb(heroColor1), hexToRgb(heroColor2), hexToRgb(heroColor3)];
    ctx.mainRgb = [hexToRgb(color1), hexToRgb(color2), hexToRgb(color3)];
  }, [
    timeSpeed,
    colorBalance,
    warpStrength,
    warpFrequency,
    warpSpeed,
    warpAmplitude,
    blendAngle,
    blendSoftness,
    rotationAmount,
    noiseScale,
    grainAmount,
    grainScale,
    grainAnimated,
    contrast,
    gamma,
    saturation,
    centerX,
    centerY,
    zoom,
    color1,
    color2,
    color3,
    heroColor1,
    heroColor2,
    heroColor3,
  ]);

  return <div ref={containerRef} className={`grainient-container ${className}`.trim()} />;
};

export default Grainient;
