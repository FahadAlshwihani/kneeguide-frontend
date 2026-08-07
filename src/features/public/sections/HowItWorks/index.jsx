import React from "react";
import { useTranslation } from "react-i18next";
import Reveal from "../../components/Reveal";
import "./HowItWorks.css";

const STEP_KEYS = ["profile", "log", "review", "adjust"];

const HowItWorks = () => {
  const { t } = useTranslation();

  return (
    <section className="hiw-root" id="how-it-works">
      <div className="hiw-container">
        <Reveal className="hiw-header">
          <span className="hiw-badge">{t("publicHowItWorks.badge")}</span>
          <h2 className="hiw-title">{t("publicHowItWorks.title")}</h2>
          <p className="hiw-description">{t("publicHowItWorks.description")}</p>
        </Reveal>

        <div className="hiw-steps">
          {STEP_KEYS.map((key, index) => (
            <Reveal as="div" key={key} delay={index * 0.1} className="hiw-step">
              <span className="hiw-step-number">{String(index + 1).padStart(2, "0")}</span>
              <div className="hiw-step-body">
                <h3 className="hiw-step-title">{t(`publicHowItWorks.steps.${key}.title`)}</h3>
                <p className="hiw-step-description">{t(`publicHowItWorks.steps.${key}.description`)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
