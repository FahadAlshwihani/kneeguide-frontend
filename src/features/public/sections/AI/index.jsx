import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaMagnifyingGlassChart, FaBell, FaFileLines, FaCircleCheck } from "react-icons/fa6";
import RevealSection from "../../components/RevealSection";
import "./AI.css";

const HIGHLIGHT_KEYS = ["trendDetection", "adherenceSignals", "clinicianSummaries"];
const HIGHLIGHT_ICONS = {
  trendDetection: FaMagnifyingGlassChart,
  adherenceSignals: FaBell,
  clinicianSummaries: FaFileLines,
};

// Each icon idles on its own independent, randomized schedule — never in
// sync with the others — matching the same pattern used for the
// PatientDashboard mock's icon confirmations.
const SCAN_DELAY_RANGE_MS = [4000, 6000];
const SCAN_DURATION_MS = 1400;

const SHAKE_DELAY_RANGE_MS = [3500, 6500];
const SHAKE_DURATION_MS = 550;

const CONFIRM_DELAY_RANGE_MS = [5000, 8000];
const CONFIRM_DURATION_MS = 2600;

const useIdleLoop = (active, [minDelay, maxDelay], duration) => {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!active) return undefined;

    let timeoutId;
    const schedule = () => {
      const delay = minDelay + Math.random() * (maxDelay - minDelay);
      timeoutId = setTimeout(() => {
        setPlaying(true);
        timeoutId = setTimeout(() => {
          setPlaying(false);
          schedule();
        }, duration);
      }, delay);
    };

    schedule();
    return () => clearTimeout(timeoutId);
  }, [active, minDelay, maxDelay, duration]);

  return playing;
};

const AI = () => {
  const { t } = useTranslation();

  const scanning = useIdleLoop(true, SCAN_DELAY_RANGE_MS, SCAN_DURATION_MS);
  const shaking = useIdleLoop(true, SHAKE_DELAY_RANGE_MS, SHAKE_DURATION_MS);
  const confirming = useIdleLoop(true, CONFIRM_DELAY_RANGE_MS, CONFIRM_DURATION_MS);

  const ICON_ANIMATION_CLASS = {
    trendDetection: scanning ? "ai-card-icon-scan" : "",
    adherenceSignals: shaking ? "ai-card-icon-shake" : "",
    clinicianSummaries: "",
  };

  return (
    <section className="ai-root" id="ai-assistant">
      <div className="ai-container">
        <RevealSection className="ai-header">
          <span className="ai-badge">{t("publicAI.badge")}</span>
          <h2 className="ai-title">{t("publicAI.title")}</h2>
          <p className="ai-description">{t("publicAI.description")}</p>
        </RevealSection>

        <div className="ai-grid">
          {HIGHLIGHT_KEYS.map((key, index) => {
            const Icon = HIGHLIGHT_ICONS[key];
            return (
              <RevealSection as="div" key={key} delay={index * 0.1} className="ai-card">
                <span className={`ai-card-icon ${ICON_ANIMATION_CLASS[key]}`.trim()}>
                  <Icon aria-hidden="true" />
                  {key === "clinicianSummaries" && (
                    <FaCircleCheck
                      aria-hidden="true"
                      className={`ai-card-icon-confirm${confirming ? " ai-card-icon-confirm-visible" : ""}`}
                    />
                  )}
                </span>
                <h3 className="ai-card-title">{t(`publicAI.highlights.${key}.title`)}</h3>
                <p className="ai-card-description">{t(`publicAI.highlights.${key}.description`)}</p>
              </RevealSection>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AI;
