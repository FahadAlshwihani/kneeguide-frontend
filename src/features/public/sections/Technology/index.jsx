import React from "react";
import { useTranslation } from "react-i18next";
import { FaCube, FaBrain, FaShieldHeart, FaArrowsRotate, FaLock, FaChartLine, FaHandshake } from "react-icons/fa6";
import Reveal from "../../components/Reveal";
import "./Technology.css";

const FEATURE_ICONS = [FaCube, FaBrain, FaShieldHeart, FaArrowsRotate];
const FEATURE_KEYS = ["modeling", "ai", "security", "sync"];

const TRUST_ICONS = [FaLock, FaChartLine, FaHandshake];
const TRUST_KEYS = ["privacy", "evidence", "realtime"];

const STAT_KEYS = ["modeling", "sync", "security"];

const Technology = () => {
  const { t } = useTranslation();

  return (
    <section className="tech-root" id="technology">
      <div className="tech-container">
        <Reveal className="tech-stats">
          {STAT_KEYS.map((key) => (
            <div className="tech-stat" key={key}>
              <span className="tech-stat-value">{t(`publicTechnology.stats.${key}Value`)}</span>
              <span className="tech-stat-label">{t(`publicTechnology.stats.${key}Label`)}</span>
            </div>
          ))}
        </Reveal>

        <Reveal className="tech-header" delay={0.05}>
          <span className="tech-badge">{t("publicTechnology.badge")}</span>
          <h2 className="tech-title">{t("publicTechnology.title")}</h2>
          <p className="tech-description">{t("publicTechnology.description")}</p>
        </Reveal>

        <div className="tech-grid">
          {FEATURE_KEYS.map((key, index) => {
            const Icon = FEATURE_ICONS[index];
            return (
              <Reveal as="div" key={key} delay={index * 0.08} className="tech-item">
                <span className="tech-icon">
                  <Icon aria-hidden="true" />
                </span>
                <h3 className="tech-item-title">{t(`publicTechnology.features.${key}Title`)}</h3>
                <p className="tech-item-description">{t(`publicTechnology.features.${key}Description`)}</p>
              </Reveal>
            );
          })}
        </div>

        <Reveal as="div" className="tech-trust" delay={0.1}>
          <p className="tech-trust-label">{t("publicTechnology.trust.label")}</p>
          <div className="tech-trust-grid">
            {TRUST_KEYS.map((key, index) => {
              const Icon = TRUST_ICONS[index];
              return (
                <div className="tech-trust-item" key={key}>
                  <span className="tech-trust-icon">
                    <Icon aria-hidden="true" />
                  </span>
                  <span>
                    <strong>{t(`publicTechnology.trust.${key}Title`)}</strong>
                    <small>{t(`publicTechnology.trust.${key}Description`)}</small>
                  </span>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default Technology;
