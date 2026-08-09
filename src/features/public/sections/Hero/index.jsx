import React from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { ROUTES } from "../../../../utils/routes";
import PrimaryButton from "../../../../components/ui/PrimaryButton";
import SecondaryButton from "../../../../components/ui/SecondaryButton";
import HeroKpiGrid from "./HeroKpiGrid";
import "./Hero.css";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: "easeOut" },
  }),
};

// Central content (badge/heading/description/CTAs) followed by a compact
// six-card KPI preview in normal document flow — replacing the previous
// ~25-widget scattered/floating composition (corners, side rails, a
// fold-crossing bottom band, a separate mobile carousel) that used to
// live outside the flex layout entirely as an absolute overlay. The KPI
// grid is real content now, not a background decoration, so the Hero is
// no longer clamped to a strict 100svh — see Hero.css.
const Hero = () => {
  const { t } = useTranslation();

  return (
    <section className="hero-root">
      <div className="hero-container">
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

        <HeroKpiGrid />
      </div>
    </section>
  );
};

export default Hero;
