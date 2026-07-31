import React from "react";
import { FaListCheck, FaChartColumn, FaRoute } from "react-icons/fa6";
import Reveal from "../../components/Reveal";
import "./Solution.css";

const PILLARS = [
  {
    icon: FaListCheck,
    title: "Track daily",
    description:
      "Patients log pain, mobility and completed exercises in under a minute a day.",
  },
  {
    icon: FaChartColumn,
    title: "Understand instantly",
    description:
      "Doctors see trends and flare-ups the moment they happen, not weeks later.",
  },
  {
    icon: FaRoute,
    title: "Adjust confidently",
    description:
      "Treatment plans evolve based on real progress data, not a five-minute recollection.",
  },
];

const Solution = () => {
  return (
    <section className="solution-root">
      <div className="solution-container">
        <Reveal className="solution-header">
          <span className="solution-badge">The KneeGuide Approach</span>
          <h2 className="solution-title">One platform, connecting every day of recovery.</h2>
          <p className="solution-description">
            KneeGuide closes the gap between appointments — turning scattered
            notes and memory into a continuous, shared view of progress.
          </p>
        </Reveal>

        <div className="solution-grid">
          {PILLARS.map((item, index) => {
            const Icon = item.icon;
            return (
              <Reveal as="div" key={item.title} delay={index * 0.1} className="solution-card">
                <span className="solution-card-icon">
                  <Icon aria-hidden="true" />
                </span>
                <h3 className="solution-card-title">{item.title}</h3>
                <p className="solution-card-description">{item.description}</p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Solution;
