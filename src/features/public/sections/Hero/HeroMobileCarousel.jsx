import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useHeroDashboardPreview } from "./HeroDashboardPreview";
import "./HeroMobileCarousel.css";

const AUTOPLAY_INTERVAL_MS = 3000;
const RESUME_DELAY_MS = 4000;
const SWIPE_THRESHOLD_PX = 45;

// Same fade + slight vertical settle every other card entrance in this
// Hero uses, just with a small horizontal slide layered on top so a swipe
// or an autoplay tick reads as a directional move, not a plain crossfade.
const slideVariants = {
  enter: (direction) => ({ opacity: 0, x: direction >= 0 ? 36 : -36, y: 12 }),
  center: { opacity: 1, x: 0, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: (direction) => ({
    opacity: 0,
    x: direction >= 0 ? -36 : 36,
    y: -12,
    transition: { duration: 0.3, ease: "easeOut" },
  }),
};

/**
 * Mobile-only: there is neither the horizontal room to frame the content
 * (rails/corners) nor the vertical room for a multi-card stack, so mobile
 * gets a single featured card instead — cycling automatically through the
 * exact same shared card pool every other zone draws from (nothing
 * reduced, just shown one at a time instead of simultaneously).
 *
 * Autoplay advances every AUTOPLAY_INTERVAL_MS, loops infinitely (index
 * math wraps both directions), and pauses the instant the user touches or
 * drags the card, resuming RESUME_DELAY_MS after that interaction ends —
 * a single `paused` boolean plus one timeout drives all of that. Swiping
 * left/right (via motion's own `drag="x"`) advances/retreats by one card;
 * dragging past SWIPE_THRESHOLD_PX in either direction is what counts as
 * a swipe rather than a tap.
 */
const HeroMobileCarousel = () => {
  const { isMobile, pool } = useHeroDashboardPreview();
  const ids = useMemo(() => Object.keys(pool), [pool]);
  const total = ids.length;

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const resumeTimerRef = useRef(null);

  const step = (delta) => {
    setDirection(delta);
    setIndex((current) => ((current + delta) % total + total) % total);
  };

  useEffect(() => {
    if (paused || total <= 1) return undefined;
    const timer = setInterval(() => step(1), AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, total]);

  useEffect(
    () => () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    },
    []
  );

  const pauseThenScheduleResume = () => {
    setPaused(true);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => setPaused(false), RESUME_DELAY_MS);
  };

  const handleDragEnd = (_event, info) => {
    if (info.offset.x <= -SWIPE_THRESHOLD_PX) {
      step(1);
    } else if (info.offset.x >= SWIPE_THRESHOLD_PX) {
      step(-1);
    }
    pauseThenScheduleResume();
  };

  if (!isMobile || total === 0) return null;

  const currentId = ids[index];

  return (
    <div className="hero-mobile-carousel" onPointerDown={pauseThenScheduleResume}>
      <AnimatePresence custom={direction} initial={false}>
        <motion.div
          key={currentId}
          className="hero-dashboard-preview-item hero-mobile-carousel-card"
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.18}
          onDragEnd={handleDragEnd}
        >
          {pool[currentId]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default HeroMobileCarousel;
