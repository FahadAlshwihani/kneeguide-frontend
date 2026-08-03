import React, { useLayoutEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { ROUTES } from "../../../../utils/routes";
import PrimaryButton from "../../../../components/ui/PrimaryButton";
import SecondaryButton from "../../../../components/ui/SecondaryButton";
import HeroDashboardPreview, { HeroDashboardBottomBand } from "./HeroDashboardPreview";
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
// box — not a guess.
const SAFE_MARGIN_MIN = 32;
const SAFE_MARGIN_MAX = 64;
const SAFE_MARGIN_VW = 0.04;

const Hero = () => {
  const { t } = useTranslation();
  const heroRootRef = useRef(null);
  const contentRef = useRef(null);
  const [safeZone, setSafeZone] = useState(null);

  // The one true source for where the headline/paragraph/CTA block
  // actually sits — HeroDashboardPreview never guesses this, it only
  // consumes it. Measured against .hero-root, not .hero-container — see
  // Hero.css's `.hero-root`/`.hero-container` overflow split. `bottom` +
  // `heroHeight` together give the bottom band a hard ceiling on how tall
  // it may render (see availableBandHeight in HeroDashboardPreview.jsx) —
  // that's what keeps it off the content even when it wraps into more
  // than one row, without ever nudging a card upward by hand. Re-measures
  // whenever the content's own box changes (text length, language/RTL
  // switch, font load) or the root's size changes (viewport resize), via
  // ResizeObserver on both.
  useLayoutEffect(() => {
    const heroRoot = heroRootRef.current;
    const content = contentRef.current;
    if (!heroRoot || !content) return undefined;

    const measure = () => {
      const rootRect = heroRoot.getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();
      const margin = Math.max(SAFE_MARGIN_MIN, Math.min(SAFE_MARGIN_MAX, rootRect.width * SAFE_MARGIN_VW));

      setSafeZone({
        top: contentRect.top - rootRect.top - margin,
        bottom: contentRect.bottom - rootRect.top + margin,
        left: contentRect.left - rootRect.left - margin,
        right: rootRect.width - (contentRect.right - rootRect.left) - margin,
        heroHeight: rootRect.height,
      });
    };

    measure();

    let observer;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(measure);
      observer.observe(heroRoot);
      observer.observe(content);
    }

    return () => observer?.disconnect();
  }, []);

  return (
    <section className="hero-root" ref={heroRootRef}>
      <div className="hero-container">
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

      {/* Rendered outside .hero-container on purpose: .hero-container is
          what clips the Hero content to the fold now (see Hero.css) — this
          sits directly in .hero-root, which no longer clips, so the bottom
          card row can float a small, deliberate amount past the fold and
          across the boundary into the next section instead of being cut
          off mid-card. */}
      <HeroDashboardBottomBand safeZone={safeZone} />
    </section>
  );
};

export default Hero;
