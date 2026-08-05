import { Children, useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import "./ScrollStack.css";
import "./MobileStack.css";

/**
 * Sequential reveal — each card is fully independent. There is no shared
 * progress value, no sticky positioning, no scroll-linked math at all:
 * one useInView per card decides which of three fixed visual states
 * (pending / active / receded) it's in, and Framer Motion tweens between
 * them. Native scrolling is the only "engine" here.
 */
const cardVariants = {
  pending: { opacity: 0, y: 60, scale: 0.96, filter: "blur(8px)" },
  active: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
  receded: { opacity: 0.92, y: 0, scale: 0.985, filter: "blur(0px)" },
};

const cardTransition = { duration: 0.7, ease: [0.16, 1, 0.3, 1] };

const RevealCard = ({ item, onEnter }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { amount: 0.5 });
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    if (isInView && !hasEntered) {
      setHasEntered(true);
      onEnter?.();
    }
  }, [isInView, hasEntered, onEnter]);

  const state = !hasEntered ? "pending" : isInView ? "active" : "receded";

  return (
    <motion.div
      ref={ref}
      className="mobile-reveal-card"
      initial="pending"
      animate={state}
      variants={cardVariants}
      transition={cardTransition}
    >
      {item}
    </motion.div>
  );
};

const MobileStack = ({ children, className = "", onStackComplete }) => {
  const items = Children.toArray(children);
  const lastIndex = items.length - 1;

  return (
    <div className={`scroll-stack-scroller ${className}`.trim()}>
      <div className="scroll-stack-inner mobile-reveal-inner">
        {items.map((item, index) => (
          <RevealCard
            key={item.key ?? index}
            item={item}
            onEnter={index === lastIndex ? onStackComplete : undefined}
          />
        ))}
      </div>
    </div>
  );
};

export default MobileStack;
