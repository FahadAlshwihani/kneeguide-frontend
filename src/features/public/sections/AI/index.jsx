import React from "react";
import { FaMagnifyingGlassChart, FaBell, FaFileLines } from "react-icons/fa6";
import Reveal from "../../components/Reveal";
import "./AI.css";

const HIGHLIGHTS = [
  {
    icon: FaMagnifyingGlassChart,
    title: "Trend detection",
    description:
      "Flags a gradual worsening or a stalled plateau in pain and mobility before it becomes a setback.",
  },
  {
    icon: FaBell,
    title: "Adherence signals",
    description:
      "Notices when logged exercises drop off, so check-ins happen before recovery stalls.",
  },
  {
    icon: FaFileLines,
    title: "Clinician-ready summaries",
    description:
      "Condenses weeks of daily logs into a short summary worth an actual look.",
  },
];

const AI = () => {
  return (
    <section className="ai-root">
      <div className="ai-container">
        <Reveal className="ai-header">
          <span className="ai-badge">AI Analysis</span>
          <h2 className="ai-title">Patterns no five-minute visit can catch.</h2>
          <p className="ai-description">
            KneeGuide's models watch daily pain, mobility and exercise data
            so your care team can focus on what actually needs attention.
          </p>
        </Reveal>

        <div className="ai-grid">
          {HIGHLIGHTS.map((item, index) => {
            const Icon = item.icon;
            return (
              <Reveal as="div" key={item.title} delay={index * 0.1} className="ai-card">
                <span className="ai-card-icon">
                  <Icon aria-hidden="true" />
                </span>
                <h3 className="ai-card-title">{item.title}</h3>
                <p className="ai-card-description">{item.description}</p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AI;
