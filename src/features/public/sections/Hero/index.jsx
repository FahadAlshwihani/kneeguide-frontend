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

const Hero = () => {
  const { t } = useTranslation();
  const heroRootRef = useRef(null);
  const contentRef = useRef(null);
  const [contentEdge, setContentEdge] = useState(null);

  // Only used by HeroDashboardBottomBand now — corners and rails are
  // fixed and untouched. The bottom-band cards are the ones that can wrap
  // into an upper row tall enough to reach behind the content; this gives
  // that component the real, measured "immediately below the CTA" line
  // (plus the Hero's own height) so it can split off whichever of its own
  // cards would otherwise land there into a separate cluster that starts
  // right after the content instead — see HeroDashboardBottomBand. Corners
  // and rails never consume this.
  useLayoutEffect(() => {
    const heroRoot = heroRootRef.current;
    const content = contentRef.current;
    if (!heroRoot || !content) return undefined;

    const measure = () => {
      const rootRect = heroRoot.getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();
      const margin = Math.max(24, Math.min(48, rootRect.width * 0.03));

      setContentEdge({
        bottom: contentRect.bottom - rootRect.top + margin,
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
        <HeroDashboardPreview />

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
          off mid-card. `contentEdge` lets it split off whichever cards
          would otherwise wrap into a row high enough to reach the content
          into their own cluster right below the CTA instead — see
          HeroDashboardBottomBand. */}
      <HeroDashboardBottomBand contentEdge={contentEdge} />
    </section>
  );
};

export default Hero;
