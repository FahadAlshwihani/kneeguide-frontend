import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { ROUTES } from "../../../../utils/routes";
import PublicBackground from "../../../../components/public/backgrounds/PublicBackground";
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

const Hero = () => {
  const { t } = useTranslation();

  return (
    <section className="hero-root">
      <PublicBackground />
      <div className="hero-vignette" aria-hidden="true" />

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
            <Link to={ROUTES.REGISTER} className="hero-btn-primary">
              {t("publicHero.ctaPrimary")}
            </Link>
            <Link to={ROUTES.LOGIN} className="hero-btn-secondary">
              {t("publicHero.ctaSecondary")}
            </Link>
          </motion.div>
        </motion.div>

        <div className="hero-preview-wrap">
          <HeroDashboardPreview />
        </div>
      </div>
    </section>
  );
};

export default Hero;
