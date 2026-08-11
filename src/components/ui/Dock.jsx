import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "motion/react";
import "./Dock.css";

/**
 * Generic, route-agnostic Dock interaction primitive — adapted from the
 * React Bits Dock demo, not pasted verbatim. Behavioral changes from the
 * original:
 *
 * - Each item's interactive element is a real react-router <Link> (or a
 *   <button> when `onClick` is given instead of `to`), not a div with
 *   role="button" — Enter-to-activate, tab order, and focus all come free
 *   from the browser instead of a manual onKeyDown handler. The magnified
 *   motion.div is purely a visual sizing wrapper around that real element.
 * - No `aria-haspopup` — the original demo set it on every item
 *   unconditionally, which is only correct for items that actually open a
 *   popup. Real navigation items expose `aria-current="page"` instead.
 * - The root is a <nav>, not a role="toolbar" div — this instance is
 *   genuinely primary navigation, not a generic control group.
 * - Proximity magnification is gated behind `event.pointerType === "mouse"`
 *   (checked per-event, not a one-time media-query snapshot, so a hybrid
 *   touch+mouse device is handled correctly either way) and behind
 *   `prefers-reduced-motion`. When gated, `mouseX` simply never leaves
 *   `Infinity`, which is enough on its own to keep every item's spring
 *   target resolved at `baseItemSize` — no separate "disable sizing" branch
 *   needed. Tap targets on touch stay exactly `baseItemSize`, always
 *   immediately tappable, no hover state to get stuck in.
 * - Colors/surfaces are CSS custom properties with generic dark defaults
 *   (Dock.css) so a consumer (see PatientDock.jsx) can re-theme the whole
 *   thing by setting those properties in its own scope, without forking
 *   this file — this is what keeps generic Dock behavior separate from
 *   patient-specific visual configuration (see PatientDock.jsx).
 *
 * Preserved from the original: the MotionValue-driven proximity spring
 * itself (no React state per pointer move — see mouseDistance/targetSize/
 * size below), the animated tooltip label, and the panel's own hover-
 * driven height growth that reserves breathing room for magnified icons
 * without shifting surrounding layout (the panel is expected to sit inside
 * a `position: fixed` wrapper — see PatientDock.css — so this height
 * animation never reflows page content either way).
 */

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
          // announcement.
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

function DockItem({ to, onClick, icon, label, active, mouseX, spring, distance, magnification, baseItemSize, reducedMotion }) {
  const ref = useRef(null);
  const isHovered = useMotionValue(0);
  const labelId = useRef(`dock-label-${Math.random().toString(36).slice(2, 9)}`).current;

  const mouseDistance = useTransform(mouseX, (val) => {
    const rect = ref.current?.getBoundingClientRect() ?? { x: 0, width: baseItemSize };
    return val - rect.x - baseItemSize / 2;
  });

  const targetSize = useTransform(mouseDistance, [-distance, 0, distance], [baseItemSize, magnification, baseItemSize]);
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
  panelHeight = 64,
  dockHeight = 128,
  baseItemSize = 48,
}) {
  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);
  const reducedMotion = prefersReducedMotion();

  const maxHeight = useMemo(
    () => Math.max(dockHeight, magnification + magnification / 2 + 4),
    [dockHeight, magnification]
  );
  const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight]);
  const height = useSpring(heightRow, spring);

  // Magnification is opt-in per pointer event, not a one-time device
  // check — `pointerType` is authoritative for the exact input that's
  // actually happening right now, which handles hybrid touch+mouse
  // laptops correctly (a media-query snapshot can't). Reduced motion is a
  // stable user preference, so a plain snapshot is appropriate there,
  // matching how the rest of this codebase already checks it.
  const handlePointerMove = (event) => {
    if (reducedMotion || event.pointerType !== "mouse") return;
    isHovered.set(1);
    mouseX.set(event.pageX);
  };

  const handlePointerLeave = () => {
    isHovered.set(0);
    mouseX.set(Infinity);
  };

  return (
    <motion.div style={{ height }} className="dock-outer">
      <motion.nav
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
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
            mouseX={mouseX}
            spring={spring}
            distance={distance}
            magnification={magnification}
            baseItemSize={baseItemSize}
            reducedMotion={reducedMotion}
          />
        ))}
      </motion.nav>
    </motion.div>
  );
}
