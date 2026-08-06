import React from "react";
import { useTranslation } from "react-i18next";
import RevealSection from "../../components/RevealSection";
import { useSectionReveal } from "../../components/useSectionReveal";
import "./Roadmap.css";

const STAGES = [
  { id: "stage1", status: "completed" },
  { id: "stage2", status: "inProgress" },
  { id: "stage3", status: "inProgress" },
  { id: "stage4", status: "future" },
];

// Empty array = no bullet list for that stage (it's optional per stage).
const STAGE_ITEM_KEYS = {
  stage1: ["authentication", "dashboard", "patientManagement", "exerciseTracking"],
  stage2: ["industrialDesign", "hardwarePrototype", "sensorIntegration", "deviceCommunication", "softwareIntegration"],
  stage3: ["patternDetection", "clinicalSummaries", "recoveryInsights"],
  stage4: ["appleWatch", "healthKit", "wearables", "multiConditionRehab"],
};

const Roadmap = () => {
  const { t } = useTranslation();
  // Drives the desktop grid's reveal (nodes fading in + line settling +
  // sweep/glow starting) — independent of each stage's own RevealSection
  // below, same shared IntersectionObserver pool either way.
  const { ref: gridRef, isVisible: gridVisible } = useSectionReveal();

  return (
    <section className="roadmap-root" id="roadmap">
      <div className="roadmap-container">
        <RevealSection className="roadmap-header">
          <span className="roadmap-badge">{t("publicRoadmap.badge")}</span>
          <h2 className="roadmap-title">{t("publicRoadmap.title")}</h2>
          <p className="roadmap-description">{t("publicRoadmap.description")}</p>
        </RevealSection>

        {/* >=768px only. One grid, one column per stage — the node,
            status, stage label, heading, description and items for a
            given stage are all inside that same column, so there is no
            longer a separate "timeline row" that can drift out of
            alignment with a separate "content row" below it. */}
        <div
          ref={gridRef}
          className={`roadmap-desktop-view${gridVisible ? " roadmap-progress-visible" : ""}`}
        >
          <div className="roadmap-desktop-connector" aria-hidden="true">
            <span className="roadmap-progress-line" />
            <span className="roadmap-progress-sweep" />
          </div>

          <div className="roadmap-desktop-grid">
            {STAGES.map((stage, index) => (
              <div key={stage.id} className="roadmap-desktop-stage">
                <span
                  className={`roadmap-progress-node roadmap-progress-node-${index + 1}`}
                  style={{ transitionDelay: `${index * 0.12}s` }}
                  aria-hidden="true"
                />
                <RevealSection as="div" delay={index * 0.1} className="roadmap-block">
                  <span className={`roadmap-block-status roadmap-block-status-${stage.status}`}>
                    {t(`publicRoadmap.status.${stage.status}`)}
                  </span>
                  <span className="roadmap-block-eyebrow">
                    {t("publicRoadmap.stageLabel", { number: index + 1 })}
                  </span>
                  <h3 className="roadmap-block-heading">{t(`publicRoadmap.stages.${stage.id}.heading`)}</h3>
                  <p className="roadmap-block-description">{t(`publicRoadmap.stages.${stage.id}.description`)}</p>
                  {STAGE_ITEM_KEYS[stage.id].length > 0 && (
                    <ul className="roadmap-block-items">
                      {STAGE_ITEM_KEYS[stage.id].map((itemKey) => (
                        <li key={itemKey}>{t(`publicRoadmap.stages.${stage.id}.items.${itemKey}`)}</li>
                      ))}
                    </ul>
                  )}
                </RevealSection>
              </div>
            ))}
          </div>
        </div>

        {/* <768px only — untouched from the previous round. */}
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
                {STAGE_ITEM_KEYS[stage.id].length > 0 && (
                  <ul className="roadmap-mobile-items">
                    {STAGE_ITEM_KEYS[stage.id].map((itemKey) => (
                      <li key={itemKey}>{t(`publicRoadmap.stages.${stage.id}.items.${itemKey}`)}</li>
                    ))}
                  </ul>
                )}
              </div>
            </RevealSection>
          ))}
        </ol>
      </div>
    </section>
  );
};

export default Roadmap;
