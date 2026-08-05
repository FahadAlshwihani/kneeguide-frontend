import { Children, useCallback, useEffect, useMemo, useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import "./ScrollStack.css";
import "./MobileStack.css";

/**
 * Purpose-built touch/mobile stack — not a ReactBits port, not a
 * simplified fallback of DesktopStack.
 *
 * Every card becomes `position: sticky` once its top reaches
 * STICK_OFFSET from the viewport top; native scrolling does the actual
 * pinning, so there is no per-frame JS driving position at all. The only
 * continuous animation — a card gently shrinking/fading/blurring as the
 * next one slides over it — is scroll-linked through Framer Motion's
 * useScroll/useTransform, which reads scroll position off the browser's
 * own scroll-linked timeline rather than a requestAnimationFrame loop or
 * per-frame getBoundingClientRect calls. IntersectionObserver is used
 * only for the one-off "stack complete" signal, not for the animation.
 */
const STICK_OFFSET = 88;

const StickyCard = ({ item, index, isLast, onEnter, onExit }) => {
  const wrapperRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: [`start ${STICK_OFFSET}px`, `end ${STICK_OFFSET}px`],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, isLast ? 1 : 0.96]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, isLast ? 1 : 0.95]);
  const blurPx = useTransform(scrollYProgress, [0, 1], [0, isLast ? 0 : 1]);
  const filter = useTransform(blurPx, (value) => `blur(${value}px)`);

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
    <div ref={wrapperRef} className="mobile-stack-item" style={{ zIndex: index + 1 }}>
      <motion.div className="mobile-stack-sticky" style={{ top: STICK_OFFSET, scale, opacity, filter }}>
        {item}
      </motion.div>
    </div>
  );
};

const MobileStack = ({ children, className = "", onStackComplete }) => {
  const items = useMemo(() => Children.toArray(children), [children]);
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
            isLast={index === items.length - 1}
            onEnter={handleEnter}
            onExit={handleExit}
          />
        ))}
      </div>
    </div>
  );
};

export default MobileStack;
