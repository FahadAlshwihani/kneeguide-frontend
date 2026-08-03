import React from "react";
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

  return (
    <section className="hero-root">
      <div className="hero-container">
        <HeroDashboardPreview />

        <div className="hero-spacer hero-spacer-top" aria-hidden="true" />

        <motion.div className="hero-content" initial="hidden" animate="visible">
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
          off mid-card. No safe-zone measurement here any more — the
          composition is fixed and allowed to run behind the content;
          .hero-container's elevated z-index (see Hero.css) is what keeps
          the copy on top wherever the two overlap. */}
      <HeroDashboardBottomBand />
    </section>
  );
};

export default Hero;
