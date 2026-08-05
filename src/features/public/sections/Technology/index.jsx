import React from "react";
import { useTranslation } from "react-i18next";
import { FaCube, FaBrain, FaShieldHeart, FaArrowsRotate } from "react-icons/fa6";
import Reveal from "../../components/Reveal";
import "./Technology.css";

const TECH_ITEMS = [
  { key: "modeling", icon: FaCube },
  { key: "aiAnalysis", icon: FaBrain },
  { key: "security", icon: FaShieldHeart },
  { key: "sync", icon: FaArrowsRotate },
];

const Technology = () => {
  const { t } = useTranslation();

  return (
    <section className="tech-root" id="technology">
      <div className="tech-container">
        <Reveal className="tech-header">
          <span className="tech-badge">{t("publicTechnology.badge")}</span>
          <h2 className="tech-title">{t("publicTechnology.title")}</h2>
          <p className="tech-description">{t("publicTechnology.description")}</p>
        </Reveal>

        <div className="tech-grid">
          {TECH_ITEMS.map((item, index) => {
            const Icon = item.icon;
            return (
              <Reveal as="div" key={item.key} delay={index * 0.08} className="tech-card">
                <span className="tech-icon">
                  <Icon aria-hidden="true" />
                </span>
                <h3 className="tech-card-title">{t(`publicTechnology.items.${item.key}.title`)}</h3>
                <p className="tech-card-description">{t(`publicTechnology.items.${item.key}.description`)}</p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Technology;
