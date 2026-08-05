import { Children, useCallback, useMemo, useRef } from "react";
import { motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import "./ScrollStack.css";
import "./MobileStack.css";

/**
 * A true deck, not a sequence of sections. All cards exist stacked inside
 * one sticky stage from the very first frame — there is no per-card
 * runway, no gap between cards, nothing that reads as "scrolling through
 * sections." One tall wrapper (mobile-deck) drives a single scroll
 * progress via useScroll; every card's position/scale/opacity is a pure
 * function of its own distance from the currently active index, computed
 * with useTransform. Scrolling doesn't move between cards, it turns one
 * continuous dial that the whole deck reacts to at once — exactly what
 * "the deck owns the scroll, not the individual cards" means in code.
 *
 * No rAF loop, no per-frame getBoundingClientRect, no custom scroll
 * engine — position: sticky pins the stage, and Framer Motion's
 * useScroll/useTransform read the browser's native scroll-linked timeline.
 * Every value is a pure function of current scroll position (not a
 * separate "animation in flight"), so it's interruptible by construction.
 */
const TRANSITION_VH = 85; // scroll distance, per card-to-card handoff
const PEEK_STEP = 110; // px each queued card sits below the active slot
const RECEDE_Y = -14; // px the just-passed card shifts up/back
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

const DeckCard = ({ item, index, activeIndex }) => {
  // Signed distance from "active": 0 = in focus, +1 = next up (peeking),
  // +2 = queued further back, -1 = just handed off (receding).
  const distance = useTransform(activeIndex, (a) => index - a);

  const y = useTransform(distance, [-1, 0, 1, 2], [RECEDE_Y, 0, PEEK_STEP, PEEK_STEP * 2], {
    ease: easeOutCubic,
  });
  const scale = useTransform(distance, [-1, 0, 1, 2], [0.97, 1, 0.98, 0.96], { ease: easeOutCubic });
  const opacity = useTransform(distance, [-1, 0, 1, 2], [0.96, 1, 0.7, 0.5], { ease: easeOutCubic });
  // Whichever card is closest to "active" must paint on top, whether it's
  // approaching from below or only just receded — not just later-in-DOM.
  const zIndex = useTransform(distance, (d) => Math.round(100 - Math.abs(d) * 10));

  return (
    <motion.div className="mobile-deck-card" style={{ y, scale, opacity, zIndex }}>
      {item}
    </motion.div>
  );
};

const MobileStack = ({ children, className = "", onStackComplete }) => {
  const items = useMemo(() => Children.toArray(children), [children]);
  const deckRef = useRef(null);
  const completedRef = useRef(false);

  const { scrollYProgress } = useScroll({
    target: deckRef,
    offset: ["start start", "end end"],
  });

  const activeIndex = useTransform(scrollYProgress, (v) => v * (items.length - 1));

  const handleProgress = useCallback(
    (v) => {
      const reachedLast = v >= 0.999;
      if (reachedLast && !completedRef.current) {
        completedRef.current = true;
        onStackComplete?.();
      } else if (!reachedLast && completedRef.current) {
        completedRef.current = false;
      }
    },
    [onStackComplete]
  );

  useMotionValueEvent(scrollYProgress, "change", handleProgress);

  return (
    <div
      ref={deckRef}
      className={`mobile-deck ${className}`.trim()}
      style={{ height: `${100 + (items.length - 1) * TRANSITION_VH}vh` }}
    >
      <div className="scroll-stack-inner mobile-deck-stage">
        {items.map((item, index) => (
          <DeckCard key={item.key ?? index} item={item} index={index} activeIndex={activeIndex} />
        ))}
      </div>
    </div>
  );
};

export default MobileStack;
