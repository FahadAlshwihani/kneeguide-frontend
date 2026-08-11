import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Mesh, Program, Renderer, Triangle, Vec3 } from "ogl";
import "./Orb.css";

/**
 * Generic WebGL Orb visual primitive — adapted from the React Bits Orb
 * demo, not pasted verbatim. Behavioral/robustness changes from the
 * original:
 *
 * - WebGL setup is wrapped in try/catch, and the canvas listens for
 *   `webglcontextlost`. Either one flips `hasError` (React state, set
 *   exactly once) and the component renders `fallback` instead of a dead
 *   canvas — this primitive must never crash or blank the page it's
 *   embedded in, since it's presentation, never business logic (see
 *   KneeGuideAssistantOrb.jsx for the patient-specific fallback content).
 * - Container sizing uses `ResizeObserver` on the container element
 *   itself instead of a global `window resize` listener — this is a
 *   fixed-size UI element (not a full-viewport canvas), so reacting only
 *   to its own box changing is both more correct and cheaper than a
 *   global listener that fires on irrelevant window-wide resizes.
 * - `prefers-reduced-motion` stops the animation loop entirely after
 *   painting one static frame, rather than running a full-speed RAF loop
 *   the user asked not to see.
 * - No React state is set per animation frame — `iTime`/`hover`/`rot` are
 *   plain mutable values inside the RAF closure/GL uniforms, exactly like
 *   the original; only `hasError` (set once, on failure) is React state.
 * - WebGL setup (renderer/program/mesh/RAF loop) runs exactly ONCE, in a
 *   mount-only effect (`[]` deps) — it used to re-run (tearing down and
 *   recreating the entire renderer/canvas/context) every time `hue`/
 *   `hoverIntensity`/`forceHoverState`/etc changed, which happens on every
 *   semantic Orb state change (KneeGuideAssistantOrb.jsx) and, now, on
 *   every conversation turn. A separate, cheap effect just writes the
 *   latest prop values into a ref (`liveProps`) on every change; the RAF
 *   loop reads from that ref each frame instead of closing over the props
 *   directly. This is what makes state/size changes update the live
 *   uniforms smoothly without ever recreating the WebGL context.
 *
 * Preserved from the original: the shader itself (unchanged GLSL), the
 * hover-distortion/rotation interaction, and the overall prop API (hue,
 * hoverIntensity, rotateOnHover, forceHoverState, backgroundColor) —
 * KneeGuideAssistantOrb.jsx maps patient-specific semantic states onto
 * these same props rather than this file knowing anything about the
 * patient product.
 */
export default function Orb({
  hue = 0,
  hoverIntensity = 0.2,
  rotateOnHover = true,
  forceHoverState = false,
  backgroundColor = "#000000",
  className = "",
}) {
  const ctnDom = useRef(null);
  const [hasError, setHasError] = useState(false);

  // Read inside the RAF loop instead of closing over the props directly —
  // see the file-level comment above for why. Kept current by the plain
  // (non-WebGL) effect right below the main setup effect. `glHandle` holds
  // the live renderer/program/mesh/reducedMotion so that same effect can
  // also trigger a single fresh static render under reduced motion — that
  // mode paints once and stops the RAF loop entirely, but a semantic state
  // change (e.g. idle -> success) still needs to reach the screen somehow,
  // so this repaints exactly one frame on prop change instead of resuming
  // a continuous loop.
  const liveProps = useRef({ hue, hoverIntensity, rotateOnHover, forceHoverState, backgroundColor });
  const glHandle = useRef({ renderer: null, program: null, mesh: null, reducedMotion: false });

  useLayoutEffect(() => {
    liveProps.current = { hue, hoverIntensity, rotateOnHover, forceHoverState, backgroundColor };

    const { renderer, program, mesh, reducedMotion } = glHandle.current;
    if (reducedMotion && renderer && program && mesh) {
      program.uniforms.hue.value = hue;
      program.uniforms.hoverIntensity.value = hoverIntensity;
      program.uniforms.backgroundColor.value = hexToVec3(backgroundColor);
      program.uniforms.hover.value = forceHoverState ? 1 : 0;
      renderer.render({ scene: mesh });
    }
  }, [hue, hoverIntensity, rotateOnHover, forceHoverState, backgroundColor]);

  const vert = /* glsl */ `
    precision highp float;
    attribute vec2 position;
    attribute vec2 uv;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const frag = /* glsl */ `
    precision highp float;

    uniform float iTime;
    uniform vec3 iResolution;
    uniform float hue;
    uniform float hover;
    uniform float rot;
    uniform float hoverIntensity;
    uniform vec3 backgroundColor;
    varying vec2 vUv;

    vec3 rgb2yiq(vec3 c) {
      float y = dot(c, vec3(0.299, 0.587, 0.114));
      float i = dot(c, vec3(0.596, -0.274, -0.322));
      float q = dot(c, vec3(0.211, -0.523, 0.312));
      return vec3(y, i, q);
    }

    vec3 yiq2rgb(vec3 c) {
      float r = c.x + 0.956 * c.y + 0.621 * c.z;
      float g = c.x - 0.272 * c.y - 0.647 * c.z;
      float b = c.x - 1.106 * c.y + 1.703 * c.z;
      return vec3(r, g, b);
    }

    vec3 adjustHue(vec3 color, float hueDeg) {
      float hueRad = hueDeg * 3.14159265 / 180.0;
      vec3 yiq = rgb2yiq(color);
      float cosA = cos(hueRad);
      float sinA = sin(hueRad);
      float i = yiq.y * cosA - yiq.z * sinA;
      float q = yiq.y * sinA + yiq.z * cosA;
      yiq.y = i;
      yiq.z = q;
      return yiq2rgb(yiq);
    }

    vec3 hash33(vec3 p3) {
      p3 = fract(p3 * vec3(0.1031, 0.11369, 0.13787));
      p3 += dot(p3, p3.yxz + 19.19);
      return -1.0 + 2.0 * fract(vec3(
        p3.x + p3.y,
        p3.x + p3.z,
        p3.y + p3.z
      ) * p3.zyx);
    }

    float snoise3(vec3 p) {
      const float K1 = 0.333333333;
      const float K2 = 0.166666667;
      vec3 i = floor(p + (p.x + p.y + p.z) * K1);
      vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);
      vec3 e = step(vec3(0.0), d0 - d0.yzx);
      vec3 i1 = e * (1.0 - e.zxy);
      vec3 i2 = 1.0 - e.zxy * (1.0 - e);
      vec3 d1 = d0 - (i1 - K2);
      vec3 d2 = d0 - (i2 - K1);
      vec3 d3 = d0 - 0.5;
      vec4 h = max(0.6 - vec4(
        dot(d0, d0),
        dot(d1, d1),
        dot(d2, d2),
        dot(d3, d3)
      ), 0.0);
      vec4 n = h * h * h * h * vec4(
        dot(d0, hash33(i)),
        dot(d1, hash33(i + i1)),
        dot(d2, hash33(i + i2)),
        dot(d3, hash33(i + 1.0))
      );
      return dot(vec4(31.316), n);
    }

    vec4 extractAlpha(vec3 colorIn) {
      float a = max(max(colorIn.r, colorIn.g), colorIn.b);
      return vec4(colorIn.rgb / (a + 1e-5), a);
    }

    const vec3 baseColor1 = vec3(0.611765, 0.262745, 0.996078);
    const vec3 baseColor2 = vec3(0.298039, 0.760784, 0.913725);
    const vec3 baseColor3 = vec3(0.062745, 0.078431, 0.600000);
    const float innerRadius = 0.6;
    const float noiseScale = 0.65;

    float light1(float intensity, float attenuation, float dist) {
      return intensity / (1.0 + dist * attenuation);
    }
    float light2(float intensity, float attenuation, float dist) {
      return intensity / (1.0 + dist * dist * attenuation);
    }

    vec4 draw(vec2 uv) {
      vec3 color1 = adjustHue(baseColor1, hue);
      vec3 color2 = adjustHue(baseColor2, hue);
      vec3 color3 = adjustHue(baseColor3, hue);

      float ang = atan(uv.y, uv.x);
      float len = length(uv);
      float invLen = len > 0.0 ? 1.0 / len : 0.0;

      float bgLuminance = dot(backgroundColor, vec3(0.299, 0.587, 0.114));

      float n0 = snoise3(vec3(uv * noiseScale, iTime * 0.5)) * 0.5 + 0.5;
      float r0 = mix(mix(innerRadius, 1.0, 0.4), mix(innerRadius, 1.0, 0.6), n0);
      float d0 = distance(uv, (r0 * invLen) * uv);
      float v0 = light1(1.0, 10.0, d0);

      v0 *= smoothstep(r0 * 1.05, r0, len);
      float innerFade = smoothstep(r0 * 0.8, r0 * 0.95, len);
      v0 *= mix(innerFade, 1.0, bgLuminance * 0.7);
      float cl = cos(ang + iTime * 2.0) * 0.5 + 0.5;

      float a = iTime * -1.0;
      vec2 pos = vec2(cos(a), sin(a)) * r0;
      float d = distance(uv, pos);
      float v1 = light2(1.5, 5.0, d);
      v1 *= light1(1.0, 50.0, d0);

      float v2 = smoothstep(1.0, mix(innerRadius, 1.0, n0 * 0.5), len);
      float v3 = smoothstep(innerRadius, mix(innerRadius, 1.0, 0.5), len);

      vec3 colBase = mix(color1, color2, cl);
      float fadeAmount = mix(1.0, 0.1, bgLuminance);

      vec3 darkCol = mix(color3, colBase, v0);
      darkCol = (darkCol + v1) * v2 * v3;
      darkCol = clamp(darkCol, 0.0, 1.0);

      vec3 lightCol = (colBase + v1) * mix(1.0, v2 * v3, fadeAmount);
      lightCol = mix(backgroundColor, lightCol, v0);
      lightCol = clamp(lightCol, 0.0, 1.0);

      vec3 finalCol = mix(darkCol, lightCol, bgLuminance);

      return extractAlpha(finalCol);
    }

    vec4 mainImage(vec2 fragCoord) {
      vec2 center = iResolution.xy * 0.5;
      float size = min(iResolution.x, iResolution.y);
      vec2 uv = (fragCoord - center) / size * 2.0;

      float angle = rot;
      float s = sin(angle);
      float c = cos(angle);
      uv = vec2(c * uv.x - s * uv.y, s * uv.x + c * uv.y);

      uv.x += hover * hoverIntensity * 0.1 * sin(uv.y * 10.0 + iTime);
      uv.y += hover * hoverIntensity * 0.1 * sin(uv.x * 10.0 + iTime);

      return draw(uv);
    }

    void main() {
      vec2 fragCoord = vUv * iResolution.xy;
      vec4 col = mainImage(fragCoord);
      gl_FragColor = vec4(col.rgb * col.a, col.a);
    }
  `;

  useEffect(() => {
    const container = ctnDom.current;
    if (!container) return undefined;

    const reducedMotion =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer;
    let gl;
    let program;
    let mesh;
    let resizeObserver;
    let rafId;
    let contextLostHandler;
    let disposed = false;

    try {
      renderer = new Renderer({ alpha: true, premultipliedAlpha: false });
      gl = renderer.gl;
      gl.clearColor(0, 0, 0, 0);
      container.appendChild(gl.canvas);

      const geometry = new Triangle(gl);
      program = new Program(gl, {
        vertex: vert,
        fragment: frag,
        uniforms: {
          iTime: { value: 0 },
          iResolution: {
            value: new Vec3(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height),
          },
          hue: { value: liveProps.current.hue },
          hover: { value: 0 },
          rot: { value: 0 },
          hoverIntensity: { value: liveProps.current.hoverIntensity },
          backgroundColor: { value: hexToVec3(liveProps.current.backgroundColor) },
        },
      });

      mesh = new Mesh(gl, { geometry, program });
      glHandle.current = { renderer, program, mesh, reducedMotion };

      const resize = () => {
        const dpr = window.devicePixelRatio || 1;
        const width = container.clientWidth;
        const height = container.clientHeight;
        if (width === 0 || height === 0) return;
        renderer.setSize(width * dpr, height * dpr);
        gl.canvas.style.width = `${width}px`;
        gl.canvas.style.height = `${height}px`;
        program.uniforms.iResolution.value.set(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height);
      };

      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);
      resize();

      let targetHover = 0;
      let lastTime = 0;
      let currentRot = 0;
      const rotationSpeed = 0.3;

      const handleMouseMove = (e) => {
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const width = rect.width;
        const height = rect.height;
        const size = Math.min(width, height);
        const centerX = width / 2;
        const centerY = height / 2;
        const uvX = ((x - centerX) / size) * 2.0;
        const uvY = ((y - centerY) / size) * 2.0;
        targetHover = Math.sqrt(uvX * uvX + uvY * uvY) < 0.8 ? 1 : 0;
      };

      const handleMouseLeave = () => {
        targetHover = 0;
      };

      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("mouseleave", handleMouseLeave);

      contextLostHandler = (event) => {
        event.preventDefault();
        cancelAnimationFrame(rafId);
        if (!disposed) setHasError(true);
      };
      gl.canvas.addEventListener("webglcontextlost", contextLostHandler);

      const update = (t) => {
        rafId = requestAnimationFrame(update);
        const { hue: liveHue, hoverIntensity: liveHoverIntensity, rotateOnHover: liveRotateOnHover, forceHoverState: liveForceHoverState, backgroundColor: liveBackgroundColor } =
          liveProps.current;

        const dt = (t - lastTime) * 0.001 || 0;
        lastTime = t;
        program.uniforms.iTime.value = t * 0.001;
        program.uniforms.hue.value = liveHue;
        program.uniforms.hoverIntensity.value = liveHoverIntensity;
        program.uniforms.backgroundColor.value = hexToVec3(liveBackgroundColor);

        const effectiveHover = liveForceHoverState ? 1 : targetHover;
        program.uniforms.hover.value += (effectiveHover - program.uniforms.hover.value) * 0.1;

        if (liveRotateOnHover && effectiveHover > 0.5) {
          currentRot += dt * rotationSpeed;
        }
        program.uniforms.rot.value = currentRot;

        renderer.render({ scene: mesh });
      };

      if (reducedMotion) {
        // One static frame — no RAF loop at all, per prefers-reduced-motion.
        program.uniforms.hover.value = liveProps.current.forceHoverState ? 1 : 0;
        renderer.render({ scene: mesh });
      } else {
        rafId = requestAnimationFrame(update);
      }

      return () => {
        disposed = true;
        cancelAnimationFrame(rafId);
        resizeObserver?.disconnect();
        container.removeEventListener("mousemove", handleMouseMove);
        container.removeEventListener("mouseleave", handleMouseLeave);
        gl.canvas.removeEventListener("webglcontextlost", contextLostHandler);
        if (gl.canvas.parentNode === container) container.removeChild(gl.canvas);
        gl.getExtension("WEBGL_lose_context")?.loseContext();
        glHandle.current = { renderer: null, program: null, mesh: null, reducedMotion: false };
      };
    } catch {
      // WebGL unavailable/failed to initialize — render the fallback
      // instead of crashing whatever page embeds this.
      setHasError(true);
      return undefined;
    }
    // Deliberately mount-once — see the file-level comment and `liveProps`/
    // `glHandle` above for how prop changes reach the renderer WITHOUT
    // tearing it down and recreating it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (hasError) {
    // No inline `background` here on purpose — it's a shorthand, and would
    // silently reset `background-image` (the actual fallback gradient,
    // Orb.css) to `none` even though inline styles normally only need to
    // beat external rules for the exact same longhand.
    return <div className={`orb-fallback ${className}`.trim()} />;
  }

  return <div ref={ctnDom} className={`orb-container ${className}`.trim()} />;
}

function hexToVec3(color) {
  if (color.startsWith("#")) {
    const r = parseInt(color.slice(1, 3), 16) / 255;
    const g = parseInt(color.slice(3, 5), 16) / 255;
    const b = parseInt(color.slice(5, 7), 16) / 255;
    return new Vec3(r, g, b);
  }

  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return new Vec3(parseInt(rgbMatch[1], 10) / 255, parseInt(rgbMatch[2], 10) / 255, parseInt(rgbMatch[3], 10) / 255);
  }

  return new Vec3(0, 0, 0);
}
