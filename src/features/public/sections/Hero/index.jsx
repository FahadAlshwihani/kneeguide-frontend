import React, { useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";
import { ROUTES } from "../../../../utils/routes";
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
  const prefersReducedMotion = useReducedMotion();

  const scrollToPlatform = useCallback(
    (event) => {
      event.preventDefault();
      document.getElementById("platform")?.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    },
    [prefersReducedMotion]
  );

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
            <button type="button" className="hero-btn-primary" onClick={scrollToPlatform}>
              {t("publicHero.ctaPrimary")}
            </button>
            <Link to={ROUTES.LOGIN} className="hero-btn-secondary">
              {t("publicHero.ctaSecondary")}
            </Link>
          </motion.div>
        </motion.div>

        <div className="hero-preview">
          <HeroDashboardPreview />
        </div>
      </div>
    </section>
  );
};

export default Hero;
