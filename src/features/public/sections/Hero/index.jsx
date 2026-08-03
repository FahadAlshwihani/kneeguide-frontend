import React from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { ROUTES } from "../../../../utils/routes";
import PrimaryButton from "../../../../components/ui/PrimaryButton";
import SecondaryButton from "../../../../components/ui/SecondaryButton";
import HeroDashboardPreview from "./HeroDashboardPreview";
import HeroMobileCarousel from "./HeroMobileCarousel";
import "./Hero.css";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: "easeOut" },
  }),
};

// The fold-crossing bottom band no longer renders here at all — it's
// rendered by HeroProblemScene, as the scene's last element, so it's
// guaranteed (by plain DOM order) to paint above Problem/Solution's own
// light-transition layers. Hero only ever renders what stays entirely
// inside its own bounds: the corner/rail composition (desktop) and the
// carousel (mobile) — neither needs to cross the fold, so neither needs
// any measurement or escape mechanism.
const Hero = () => {
  const { t } = useTranslation();

  return (
    <section className="hero-root">
      <div className="hero-container">
        <HeroDashboardPreview />
        <HeroMobileCarousel />

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
    </section>
  );
};

export default Hero;
