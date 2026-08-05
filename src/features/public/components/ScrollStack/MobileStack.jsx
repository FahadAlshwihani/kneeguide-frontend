import { Children, useCallback, useEffect, useMemo, useRef } from "react";
import { motion, motionValue, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import "./ScrollStack.css";
import "./MobileStack.css";

/**
 * Purpose-built "stacked deck" interaction for touch — Apple Wallet's
 * interaction philosophy (a card settles into focus, the next one rises
 * from below and takes over, the previous one gently recedes), not its
 * visuals and not a ReactBits port.
 *
 * There is no rAF loop, no per-frame getBoundingClientRect, no custom
 * scroll engine. `position: sticky` does the actual pinning, and native
 * scrolling carries each card up from below "for free" — the only JS is a
 * short, scroll-linked settle/recede animation right around the moment a
 * card reaches its stick point, driven by Framer Motion's useScroll /
 * useTransform (which read the browser's own scroll timeline). Because
 * every animated value is a pure function of current scroll position,
 * there's no separate "animation in flight" to desync — scrolling back up
 * mid-transition just re-reads the same values, so it's interruptible by
 * construction.
 */
const STICK_OFFSET = 88;
const HANDOFF_WINDOW = 260;
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

const StickyCard = ({ item, index, isFirst, isLast, nextProgress, onProgress, onEnter, onExit }) => {
  const wrapperRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: [`start ${STICK_OFFSET + HANDOFF_WINDOW}px`, `start ${STICK_OFFSET}px`],
  });

  useMotionValueEvent(scrollYProgress, "change", onProgress);

  // Arrival: settles into place as this card approaches its stick point.
  const enterY = useTransform(scrollYProgress, [0, 1], [isFirst ? 0 : 32, 0], { ease: easeOutCubic });
  const enterOpacity = useTransform(scrollYProgress, [0, 1], [isFirst ? 1 : 0.7, 1], { ease: easeOutCubic });
  const enterScale = useTransform(scrollYProgress, [0, 1], [isFirst ? 1 : 0.98, 1], { ease: easeOutCubic });

  // Recede: driven by the NEXT card's own arrival progress, so this card
  // visibly compresses and steps back exactly as the next one takes over.
  const recedeSource = nextProgress ?? scrollYProgress;
  const recedeY = useTransform(recedeSource, [0, 1], [0, isLast ? 0 : -10], { ease: easeOutCubic });
  const recedeOpacity = useTransform(recedeSource, [0, 1], [1, isLast ? 1 : 0.96], { ease: easeOutCubic });
  const recedeScale = useTransform(recedeSource, [0, 1], [1, isLast ? 1 : 0.97], { ease: easeOutCubic });

  const y = useTransform([enterY, recedeY], ([a, b]) => a + b);
  const opacity = useTransform([enterOpacity, recedeOpacity], ([a, b]) => a * b);
  const scale = useTransform([enterScale, recedeScale], ([a, b]) => a * b);

  useEffect(() => {
    if (!isLast) return undefined;
    const wrapper = wrapperRef.current;
    if (!wrapper || typeof IntersectionObserver === "undefined") return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onEnter?.();
        } else if (entry.boundingClientRect.top < 0) {
          onExit?.();
        }
      },
      { rootMargin: `-${STICK_OFFSET}px 0px 0px 0px`, threshold: 0 }
    );
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [isLast, onEnter, onExit]);

  return (
    <div
      ref={wrapperRef}
      className={`mobile-stack-item${isLast ? " mobile-stack-item-last" : ""}`}
      style={{ zIndex: index + 1 }}
    >
      <motion.div className="mobile-stack-sticky" style={{ top: STICK_OFFSET, y, scale, opacity }}>
        {item}
      </motion.div>
    </div>
  );
};

const MobileStack = ({ children, className = "", onStackComplete }) => {
  const items = useMemo(() => Children.toArray(children), [children]);
  const progressValues = useMemo(() => items.map(() => motionValue(0)), [items.length]);
  const completedRef = useRef(false);

  const handleEnter = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onStackComplete?.();
  }, [onStackComplete]);

  const handleExit = useCallback(() => {
    completedRef.current = false;
  }, []);

  return (
    <div className={`scroll-stack-scroller ${className}`.trim()}>
      <div className="scroll-stack-inner mobile-stack-inner">
        {items.map((item, index) => (
          <StickyCard
            key={item.key ?? index}
            item={item}
            index={index}
            isFirst={index === 0}
            isLast={index === items.length - 1}
            nextProgress={index < items.length - 1 ? progressValues[index + 1] : null}
            onProgress={(v) => progressValues[index].set(v)}
            onEnter={handleEnter}
            onExit={handleExit}
          />
        ))}
      </div>
    </div>
  );
};

export default MobileStack;
