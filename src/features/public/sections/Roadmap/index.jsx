import React from "react";
import { useTranslation } from "react-i18next";
import RevealSection from "../../components/RevealSection";
import { useSectionReveal } from "../../components/useSectionReveal";
import "./Roadmap.css";

const MILESTONE_KEYS = ["now", "next", "later", "future"];

const Roadmap = () => {
  const { t } = useTranslation();
  // Drives the timeline's own reveal (line settle + staggered nodes),
  // independent of each card's own RevealSection below — same shared
  // IntersectionObserver pool either way, see useSectionReveal.js.
  const { ref: timelineRef, isVisible: timelineVisible } = useSectionReveal();

  return (
    <section className="roadmap-root" id="roadmap">
      <div className="roadmap-container">
        <RevealSection className="roadmap-header">
          <span className="roadmap-badge">{t("publicRoadmap.badge")}</span>
          <h2 className="roadmap-title">{t("publicRoadmap.title")}</h2>
          <p className="roadmap-description">{t("publicRoadmap.description")}</p>
        </RevealSection>

        {/* The only place the stage names appear now — cards below start
            directly with their title, no repeated NOW/NEXT/LATER/FUTURE.
            Dots/line/sweep carry no information of their own, so they're
            aria-hidden; the stage labels are kept as real, accessible
            text. */}
        <div ref={timelineRef} className={`roadmap-progress${timelineVisible ? " roadmap-progress-visible" : ""}`}>
          <div className="roadmap-progress-track" aria-hidden="true">
            <span className="roadmap-progress-line" />
            <span className="roadmap-progress-sweep" />
            {MILESTONE_KEYS.map((key, index) => (
              <span
                key={key}
                className={`roadmap-progress-node roadmap-progress-node-${key}`}
                style={{ transitionDelay: `${index * 0.12}s` }}
              />
            ))}
          </div>
          <div className="roadmap-progress-labels">
            {MILESTONE_KEYS.map((key) => (
              <span key={key} className={`roadmap-progress-label roadmap-progress-label-${key}`}>
                {t(`publicRoadmap.timeline.${key}`)}
              </span>
            ))}
          </div>
        </div>

        <div className="roadmap-timeline">
          {MILESTONE_KEYS.map((key, index) => (
            <RevealSection as="div" key={key} delay={index * 0.1} className={`roadmap-item roadmap-item-${key}`}>
              <h3 className="roadmap-item-title">{t(`publicRoadmap.milestones.${key}.title`)}</h3>
              <p className="roadmap-item-description">{t(`publicRoadmap.milestones.${key}.description`)}</p>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Roadmap;
