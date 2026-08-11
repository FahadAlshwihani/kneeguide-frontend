import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "motion/react";
import "./Dock.css";

/**
 * Generic, route-agnostic Dock interaction primitive — adapted from the
 * React Bits Dock demo, not pasted verbatim. See the previous revision's
 * notes for the semantics/accessibility adaptations (real <Link>/<button>
 * per item, no aria-haspopup, <nav> root, CSS-custom-property theming).
 * This revision fixes icon sizing and adds finger-proximity magnification
 * for touch/pen, on top of that unchanged foundation:
 *
 * - ICON SIZE: `.dock-icon svg` used to be `width:100%; height:100%` of a
 *   container that itself scaled to 60% of the item's own animated
 *   (spring) size — so the icon grew a SECOND time on top of the item
 *   already growing ("double magnification"), and any `size` prop passed
 *   to the icon element was silently overridden by that CSS regardless of
 *   its value. Icon size is now a fixed CSS custom property
 *   (--dock-icon-size, set once by the consumer — see PatientDock.css)
 *   applied directly to `.dock-icon svg`, completely decoupled from the
 *   item's own spring `size` — the item's box grows for breathing room,
 *   the icon itself does not independently grow with it.
 *
 * - TOUCH: mouse-only proximity before this revision (touch always sat at
 *   `baseItemSize`, no magnification at all). Touch/pen now gets its own
 *   smaller-amplitude proximity magnification via a shared `pointerX`
 *   MotionValue fed by both mouse `pointermove` and touch/pen
 *   `pointerdown`/`pointermove` — physical pointer position either way,
 *   so RTL needs no special-casing (see mouseDistance below: it reads
 *   each item's own live `getBoundingClientRect()`, which is already
 *   correct under a flex-reversed RTL layout). A `pointerKind` MotionValue
 *   (0 = mouse-tuned range, 1 = touch-tuned range) lets each item's
 *   `targetSize` pick the right (magnification, distance) pair without
 *   any React re-render — see the array-combinator `useTransform` in
 *   DockItem. Tap-vs-drag is a small ref-tracked pixel threshold (not
 *   React state); a genuine tap is left alone entirely (the real <Link>
 *   navigates natively), a detected drag suppresses exactly the one
 *   synthetic click that would otherwise fire under the finger on
 *   release, via a capture-phase click handler on the panel — no
 *   preventDefault race with touch's passive-listener defaults, since
 *   Pointer Events (unlike touchstart/touchmove) aren't passive by
 *   default. `setPointerCapture` on pointerdown keeps every subsequent
 *   event scoped to the panel element itself — no window-level listener
 *   anywhere in this file.
 */

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// How far a touch has to travel before it's treated as exploration rather
// than a tap — small on purpose (a few px of natural finger jitter during
// a tap must NOT suppress its navigation), independent of the proximity
// response itself, which reacts with zero threshold (every pointer
// position update feeds the magnification immediately).
const DRAG_THRESHOLD_PX = 8;

function DockLabel({ id, isHovered, reducedMotion, children }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = isHovered.on("change", (latest) => setIsVisible(latest === 1));
    return () => unsubscribe();
  }, [isHovered]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          id={id}
          // Purely a sighted-user visual aid — the item's own aria-label
          // already supplies the accessible name (see DockItem), so this
          // is hidden from assistive tech rather than risking a doubled
          // announcement. Also never driven by touch proximity (see
          // DockItem) — only real mouse hover / keyboard focus show it, so
          // sliding a finger across the Dock never makes labels jump.
          aria-hidden="true"
          initial={reducedMotion ? false : { opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -10 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.2 }}
          className="dock-label"
          role="tooltip"
          style={{ x: "-50%" }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DockItem({
  to,
  onClick,
  icon,
  label,
  active,
  pointerX,
  pointerKind,
  spring,
  distance,
  magnification,
  touchDistance,
  touchMagnification,
  baseItemSize,
  reducedMotion,
}) {
  const ref = useRef(null);
  const isHovered = useMotionValue(0);
  const labelId = useRef(`dock-label-${Math.random().toString(36).slice(2, 9)}`).current;

  const pointerDistance = useTransform(pointerX, (val) => {
    const rect = ref.current?.getBoundingClientRect() ?? { x: 0, width: baseItemSize };
    return val - rect.x - baseItemSize / 2;
  });

  // Continuous distance-based falloff, same shape for mouse and touch —
  // only the (distance, magnification) pair differs, selected by
  // `pointerKind` (no hard activeIndex ± 1 steps). `pointerKind` reads as
  // a plain 0/1 float via the combinator, so this stays one smooth
  // function instead of two branches with a visible seam.
  const targetSize = useTransform([pointerDistance, pointerKind], (latest) => {
    const [dist, kind] = latest;
    const dst = kind >= 0.5 ? touchDistance : distance;
    const mag = kind >= 0.5 ? touchMagnification : magnification;
    const clamped = Math.max(-dst, Math.min(dst, dist));
    const ratio = 1 - Math.abs(clamped) / dst;
    return baseItemSize + ratio * (mag - baseItemSize);
  });
  const size = useSpring(targetSize, spring);

  const handleHoverStart = () => isHovered.set(1);
  const handleHoverEnd = () => isHovered.set(0);

  const content = (
    <span className="dock-icon" aria-hidden="true">
      {icon}
    </span>
  );

  const sharedProps = {
    ref,
    className: `dock-item-link${active ? " dock-item-link--active" : ""}`,
    "aria-label": label,
    "aria-describedby": labelId,
    onFocus: handleHoverStart,
    onBlur: handleHoverEnd,
  };

  return (
    <motion.div
      style={{ width: size, height: size }}
      onHoverStart={handleHoverStart}
      onHoverEnd={handleHoverEnd}
      className={`dock-item${active ? " dock-item--active" : ""}`}
    >
      {to ? (
        <Link to={to} aria-current={active ? "page" : undefined} {...sharedProps}>
          {content}
        </Link>
      ) : (
        <button type="button" onClick={onClick} {...sharedProps}>
          {content}
        </button>
      )}
      <DockLabel id={labelId} isHovered={isHovered} reducedMotion={reducedMotion}>
        {label}
      </DockLabel>
    </motion.div>
  );
}

export default function Dock({
  items,
  className = "",
  ariaLabel,
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = 64,
  distance = 180,
  touchMagnification = 58,
  touchDistance = 100,
  panelHeight = 64,
  dockHeight = 128,
  baseItemSize = 48,
}) {
  const pointerX = useMotionValue(Infinity);
  const pointerKind = useMotionValue(0);
  const isHovered = useMotionValue(0);
  const reducedMotion = prefersReducedMotion();

  // Ref, not state — read synchronously inside plain DOM event handlers,
  // never drives a render. `pointerId`/`dragging` reset on every
  // pointerup/pointercancel; a second simultaneous touch is ignored while
  // one is already active (no jump from an accidental second finger).
  const touchState = useRef({ active: false, pointerId: null, startX: 0, startY: 0, dragging: false });
  const suppressNextClick = useRef(false);

  const maxHeight = useMemo(
    () => Math.max(dockHeight, magnification + magnification / 2 + 4),
    [dockHeight, magnification]
  );
  const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight]);
  const height = useSpring(heightRow, spring);

  // ---------- Mouse (fine pointer) ----------
  const handlePointerMove = (event) => {
    if (reducedMotion || event.pointerType !== "mouse") return;
    pointerKind.set(0);
    isHovered.set(1);
    pointerX.set(event.pageX);
  };

  const handlePointerLeave = (event) => {
    if (event.pointerType && event.pointerType !== "mouse") return;
    isHovered.set(0);
    pointerX.set(Infinity);
  };

  // ---------- Touch / pen (coarse or stylus pointers) ----------
  // Deliberately branches on `event.pointerType` per-event rather than a
  // one-time `(pointer: coarse)` media-query snapshot — that's what makes
  // a hybrid device (an iPad with an attached mouse/trackpad) correct
  // either way, for whichever input is actually being used right now.
  const handleTouchPointerDown = (event) => {
    if (reducedMotion || event.pointerType === "mouse" || touchState.current.active) return;

    touchState.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      dragging: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);

    // Responds immediately, before any movement — "touching begins
    // interaction immediately" — not gated behind the drag threshold
    // below, which only ever governs the separate tap-vs-drag decision.
    pointerKind.set(1);
    isHovered.set(1);
    pointerX.set(event.pageX);
  };

  const handleTouchPointerMove = (event) => {
    const state = touchState.current;
    if (!state.active || event.pointerId !== state.pointerId) return;

    pointerX.set(event.pageX);

    if (!state.dragging) {
      const dx = event.clientX - state.startX;
      const dy = event.clientY - state.startY;
      if (Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) {
        state.dragging = true;
      }
    }
  };

  const endTouch = (event) => {
    const state = touchState.current;
    if (!state.active || event.pointerId !== state.pointerId) return;

    if (state.dragging) {
      // Consumed once by handleClickCapture below — the finger explored
      // across items, so the synthetic click under wherever it lifted
      // must not navigate. A plain tap never sets `dragging`, so it never
      // reaches this branch and the real <Link> click fires normally.
      suppressNextClick.current = true;
    }

    isHovered.set(0);
    pointerX.set(Infinity);
    touchState.current = { active: false, pointerId: null, startX: 0, startY: 0, dragging: false };
  };

  const handleClickCapture = (event) => {
    if (!suppressNextClick.current) return;
    suppressNextClick.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <motion.div style={{ height }} className="dock-outer">
      <motion.nav
        onPointerMove={(event) => {
          handlePointerMove(event);
          handleTouchPointerMove(event);
        }}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handleTouchPointerDown}
        onPointerUp={endTouch}
        onPointerCancel={endTouch}
        onClickCapture={handleClickCapture}
        className={`dock-panel ${className}`}
        style={{ height: panelHeight }}
        aria-label={ariaLabel}
      >
        {items.map((item) => (
          <DockItem
            key={item.key}
            to={item.to}
            onClick={item.onClick}
            icon={item.icon}
            label={item.label}
            active={item.active}
            pointerX={pointerX}
            pointerKind={pointerKind}
            spring={spring}
            distance={distance}
            magnification={magnification}
            touchDistance={touchDistance}
            touchMagnification={touchMagnification}
            baseItemSize={baseItemSize}
            reducedMotion={reducedMotion}
          />
        ))}
      </motion.nav>
    </motion.div>
  );
}
