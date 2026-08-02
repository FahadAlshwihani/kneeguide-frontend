import React from "react";
import { FaClipboardList, FaCommentSlash, FaChartLine } from "react-icons/fa6";
import Reveal from "../../components/Reveal";
import "./Problem.css";

const PROBLEMS = [
  {
    icon: FaClipboardList,
    title: "Inconsistent home exercises",
    description:
      "Patients leave the clinic with a printed sheet and no way to track whether they actually followed it.",
  },
  {
    icon: FaCommentSlash,
    title: "Pain that goes unreported",
    description:
      "A five-minute visit rarely captures how pain and mobility really changed week to week.",
  },
  {
    icon: FaChartLine,
    title: "Decisions made blind between visits",
    description:
      "Without daily data, clinicians adjust treatment plans on memory instead of evidence.",
  },
];

const Problem = () => {
  return (
    <section className="problem-root">
      {/* Purely decorative bridge from the Hero's dark Beams canvas into
          this section's own light surface — see Problem.css for the
          layered gradients/mask/blend-modes. Never affects layout: it's
          an absolutely positioned underlay, not part of document flow. */}
      <div className="problem-transition" aria-hidden="true">
        <div className="problem-transition-base" />
        <div className="problem-transition-beams" />
        <div className="problem-transition-glow" />
      </div>

      <div className="problem-container">
        <Reveal className="problem-header">
          <span className="problem-badge">The Challenge</span>
          <h2 className="problem-title">Recovery breaks down between appointments.</h2>
          <p className="problem-description">
            Most knee rehabilitation still runs on memory and guesswork —
            leaving both patients and doctors working with an incomplete
            picture of how recovery is really going.
          </p>
        </Reveal>

        <div className="problem-grid">
          {PROBLEMS.map((item, index) => {
            const Icon = item.icon;
            return (
              <Reveal as="div" key={item.title} delay={index * 0.1} className="problem-card">
                <span className="problem-card-icon">
                  <Icon aria-hidden="true" />
                </span>
                <h3 className="problem-card-title">{item.title}</h3>
                <p className="problem-card-description">{item.description}</p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Problem;
