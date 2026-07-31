import React from "react";
import { motion } from "motion/react";

/**
 * Shared scroll-reveal wrapper used by landing sections (fade + slide up
 * as it enters the viewport). Not a styled component — pass className
 * through so each section keeps its own scoped CSS.
 */
const Reveal = ({ as = "div", delay = 0, className, children, ...rest }) => {
  const MotionTag = motion[as] || motion.div;

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
};

export default Reveal;
