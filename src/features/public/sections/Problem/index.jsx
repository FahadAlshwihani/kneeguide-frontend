import React from "react";
import { useTranslation } from "react-i18next";
import { FaClipboardList, FaCommentSlash, FaChartLine, FaUser, FaUserDoctor, FaPeopleGroup } from "react-icons/fa6";
import Reveal from "../../components/Reveal";
import "./Problem.css";

const STAT_ICONLESS_KEYS = ["adherence", "dropout", "followup"];

const AUDIENCE_ICONS = [FaUser, FaUserDoctor, FaPeopleGroup];
const AUDIENCE_KEYS = ["patients", "clinicians", "teams"];

const CARD_ICONS = [FaClipboardList, FaCommentSlash, FaChartLine];
const CARD_KEYS = ["exercises", "pain", "decisions"];

const Problem = () => {
  const { t } = useTranslation();

  return (
    <section className="problem-root">
      <div className="problem-container">
        {/* 1. Projected impact statistics — first element, before the badge/title/description. */}
        <Reveal className="problem-stats">
          <p className="problem-stats-eyebrow">{t("publicProblem.stats.eyebrow")}</p>
          <div className="problem-stats-row">
            {STAT_ICONLESS_KEYS.map((key) => (
              <div className="problem-stat" key={key}>
                <span className="problem-stat-value">{t(`publicProblem.stats.${key}Value`)}</span>
                <span className="problem-stat-label">{t(`publicProblem.stats.${key}Label`)}</span>
              </div>
            ))}
          </div>
        </Reveal>

        {/* 2. Designed-for audience row — directly after stats, brand-free (no logos). */}
        <Reveal as="div" className="problem-audience" delay={0.05}>
          {AUDIENCE_KEYS.map((key, index) => {
            const Icon = AUDIENCE_ICONS[index];
            return (
              <div className="problem-audience-item" key={key}>
                <span className="problem-audience-icon">
                  <Icon aria-hidden="true" />
                </span>
                <span className="problem-audience-label">{t(`publicProblem.audience.${key}`)}</span>
              </div>
            );
          })}
        </Reveal>

        {/* 3. Section badge, title and description. */}
        <Reveal className="problem-header" delay={0.1}>
          <span className="problem-badge">{t("publicProblem.badge")}</span>
          <h2 className="problem-title">{t("publicProblem.title")}</h2>
          <p className="problem-description">{t("publicProblem.description")}</p>
        </Reveal>

        {/* 4. The only elements in this section allowed to look like cards. */}
        <div className="problem-grid">
          {CARD_KEYS.map((key, index) => {
            const Icon = CARD_ICONS[index];
            return (
              <Reveal as="div" key={key} delay={0.15 + index * 0.1} className="problem-card">
                <span className="problem-card-icon">
                  <Icon aria-hidden="true" />
                </span>
                <h3 className="problem-card-title">{t(`publicProblem.cards.${key}Title`)}</h3>
                <p className="problem-card-description">{t(`publicProblem.cards.${key}Description`)}</p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Problem;
