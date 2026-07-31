import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ROUTES } from "../../../../utils/routes";
import HeroVisual from "../../components/HeroVisual";
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
  return (
    <section className="hero-root">
      <div className="hero-container">
        <motion.div
          className="hero-content"
          initial="hidden"
          animate="visible"
        >
          <motion.span className="hero-badge" variants={fadeUp} custom={0}>
            AI-Guided Rehabilitation
          </motion.span>

          <motion.h1 className="hero-title" variants={fadeUp} custom={0.08}>
            Recover from knee injuries with clarity, not guesswork.
          </motion.h1>

          <motion.p className="hero-description" variants={fadeUp} custom={0.16}>
            KneeGuide pairs day-to-day pain and mobility tracking with
            AI-assisted analysis, so patients stay on track and doctors
            always know exactly how recovery is progressing.
          </motion.p>

          <motion.div className="hero-actions" variants={fadeUp} custom={0.24}>
            <Link to={ROUTES.REGISTER} className="hero-btn-primary">
              Start Your Recovery
            </Link>
            <Link to={ROUTES.LOGIN} className="hero-btn-secondary">
              I&apos;m a Clinician
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          className="hero-visual-col"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
        >
          <HeroVisual />
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
