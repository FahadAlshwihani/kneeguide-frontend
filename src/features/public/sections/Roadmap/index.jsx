import React from "react";
import { useTranslation } from "react-i18next";
import RevealSection from "../../components/RevealSection";
import { useSectionReveal } from "../../components/useSectionReveal";
import "./Roadmap.css";

const STAGES = [
  { id: "stage1", status: "completed" },
  { id: "stage2", status: "completed" },
  { id: "stage3", status: "inProgress" },
  { id: "stage4", status: "future" },
];

const STAGE_ITEM_KEYS = {
  stage1: ["dashboard", "authentication", "patientLogging", "exerciseTracking"],
  stage2: ["patternDetection", "clinicalSummaries", "recoveryInsights"],
  stage3: ["appleWatch", "healthKit", "sensorSyncing"],
  stage4: ["rehabPrograms", "multiCondition", "expandedPlatform"],
};

const Roadmap = () => {
  const { t } = useTranslation();
  // Drives the horizontal timeline's own reveal (line settle + staggered
  // nodes + sweep/glow start) — independent of each block's own
  // RevealSection, same shared IntersectionObserver pool either way.
  const { ref: timelineRef, isVisible: timelineVisible } = useSectionReveal();

  return (
    <section className="roadmap-root" id="roadmap">
      <div className="roadmap-container">
        <RevealSection className="roadmap-header">
          <span className="roadmap-badge">{t("publicRoadmap.badge")}</span>
          <h2 className="roadmap-title">{t("publicRoadmap.title")}</h2>
          <p className="roadmap-description">{t("publicRoadmap.description")}</p>
        </RevealSection>

        {/* >=768px: horizontal timeline + plain content blocks below it.
            The timeline is the only place stage status appears — blocks
            only get a neutral "Stage N" eyebrow, never repeating
            Completed/In Progress/Future a second time. */}
        <div className="roadmap-desktop-view">
          <div
            ref={timelineRef}
            className={`roadmap-progress${timelineVisible ? " roadmap-progress-visible" : ""}`}
          >
            <div className="roadmap-progress-track" aria-hidden="true">
              <span className="roadmap-progress-line" />
              <span className="roadmap-progress-sweep" />
              {STAGES.map((stage, index) => (
                <span
                  key={stage.id}
                  className={`roadmap-progress-node roadmap-progress-node-${index + 1}`}
                  style={{ transitionDelay: `${index * 0.12}s` }}
                />
              ))}
            </div>
            <div className="roadmap-progress-labels">
              {STAGES.map((stage) => (
                <span key={stage.id} className={`roadmap-progress-label roadmap-progress-label-${stage.status}`}>
                  {t(`publicRoadmap.status.${stage.status}`)}
                </span>
              ))}
            </div>
          </div>

          <div className="roadmap-blocks">
            {STAGES.map((stage, index) => (
              <RevealSection as="div" key={stage.id} delay={index * 0.1} className="roadmap-block">
                <span className="roadmap-block-eyebrow">
                  {t("publicRoadmap.stageLabel", { number: index + 1 })}
                </span>
                <h3 className="roadmap-block-heading">{t(`publicRoadmap.stages.${stage.id}.heading`)}</h3>
                <p className="roadmap-block-description">{t(`publicRoadmap.stages.${stage.id}.description`)}</p>
                <ul className="roadmap-block-items">
                  {STAGE_ITEM_KEYS[stage.id].map((itemKey) => (
                    <li key={itemKey}>{t(`publicRoadmap.stages.${stage.id}.items.${itemKey}`)}</li>
                  ))}
                </ul>
              </RevealSection>
            ))}
          </div>
        </div>

        {/* <768px: a dedicated vertical timeline — dot/connector, status
            and heading together per stage, exactly the structure a
            vertical roadmap needs instead of the horizontal one
            squeezed into a narrow viewport. */}
        <ol className="roadmap-mobile-view">
          {STAGES.map((stage, index) => (
            <RevealSection
              as="li"
              key={stage.id}
              delay={index * 0.08}
              className={`roadmap-mobile-item roadmap-mobile-item-${index + 1}`}
            >
              <span className="roadmap-mobile-marker" aria-hidden="true">
                <span className="roadmap-mobile-dot" />
                {index < STAGES.length - 1 && <span className="roadmap-mobile-connector" />}
              </span>
              <div className="roadmap-mobile-content">
                <span className="roadmap-mobile-status">{t(`publicRoadmap.status.${stage.status}`)}</span>
                <h3 className="roadmap-mobile-heading">{t(`publicRoadmap.stages.${stage.id}.heading`)}</h3>
                <p className="roadmap-mobile-description">{t(`publicRoadmap.stages.${stage.id}.description`)}</p>
                <ul className="roadmap-mobile-items">
                  {STAGE_ITEM_KEYS[stage.id].map((itemKey) => (
                    <li key={itemKey}>{t(`publicRoadmap.stages.${stage.id}.items.${itemKey}`)}</li>
                  ))}
                </ul>
              </div>
            </RevealSection>
          ))}
        </ol>
      </div>
    </section>
  );
};

export default Roadmap;
