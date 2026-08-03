import React, { useLayoutEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { ROUTES } from "../../../../utils/routes";
import PrimaryButton from "../../../../components/ui/PrimaryButton";
import SecondaryButton from "../../../../components/ui/SecondaryButton";
import HeroDashboardPreview from "./HeroDashboardPreview";
import "./Hero.css";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: "easeOut" },
  }),
};

// Breathing room kept clear on every side of the real, measured content
// box — not a guess. Bottom gets extra: the brief specifically wants the
// card band to visibly begin *below* the CTA row, not just clear it.
const SAFE_MARGIN_MIN = 32;
const SAFE_MARGIN_MAX = 64;
const SAFE_MARGIN_VW = 0.04;
const SAFE_BOTTOM_EXTRA = 24;

const Hero = () => {
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [safeZone, setSafeZone] = useState(null);

  // The one true source for where the headline/paragraph/CTA block
  // actually sits — HeroDashboardPreview never guesses this, it only
  // consumes it. Re-measures whenever the content's own box changes
  // (text length, language/RTL switch, font load) or the container's
  // width changes (viewport resize), via ResizeObserver on both.
  useLayoutEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return undefined;

    const measure = () => {
      const containerRect = container.getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();
      const margin = Math.max(
        SAFE_MARGIN_MIN,
        Math.min(SAFE_MARGIN_MAX, containerRect.width * SAFE_MARGIN_VW)
      );

      setSafeZone({
        top: contentRect.top - containerRect.top - margin,
        bottom: contentRect.bottom - containerRect.top + margin + SAFE_BOTTOM_EXTRA,
        left: contentRect.left - containerRect.left - margin,
        right: containerRect.width - (contentRect.right - containerRect.left) - margin,
      });
    };

    measure();

    let observer;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(measure);
      observer.observe(container);
      observer.observe(content);
    }

    return () => observer?.disconnect();
  }, []);

  return (
    <section className="hero-root">
      <div className="hero-container" ref={containerRef}>
        <HeroDashboardPreview safeZone={safeZone} />

        <div className="hero-spacer hero-spacer-top" aria-hidden="true" />

        <motion.div className="hero-content" ref={contentRef} initial="hidden" animate="visible">
          <motion.span className="hero-badge" variants={fadeUp} custom={0}>
            {t("publicHero.badge")}
          </motion.span>

          <motion.h1 className="hero-title" variants={fadeUp} custom={0.08}>
            {t("publicHero.headingLine1")}
            <br />
            {t("publicHero.headingLine2")}
          </motion.h1>

          <motion.p className="hero-description" variants={fadeUp} custom={0.16}>
            {t("publicHero.description")}
          </motion.p>

          <motion.div className="hero-actions" variants={fadeUp} custom={0.24}>
            <PrimaryButton to={ROUTES.REGISTER} size="lg">
              {t("publicHero.ctaPrimary")}
            </PrimaryButton>
            <SecondaryButton to={ROUTES.LOGIN} size="lg">
              {t("publicHero.ctaSecondary")}
            </SecondaryButton>
          </motion.div>
        </motion.div>

        <div className="hero-spacer hero-spacer-bottom" aria-hidden="true" />
      </div>
    </section>
  );
};

export default Hero;
