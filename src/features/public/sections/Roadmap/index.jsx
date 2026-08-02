import React from "react";
import Reveal from "../../components/Reveal";
import "./Roadmap.css";

const MILESTONES = [
  {
    phase: "Now",
    title: "Core tracking & dashboards",
    description: "Daily pain and exercise logging, live for patients and clinicians today.",
  },
  {
    phase: "Next",
    title: "AI trend analysis",
    description: "Rolling out pattern detection across pilot clinics.",
  },
  {
    phase: "Later",
    title: "Wearable integration",
    description: "Syncing mobility data automatically from wearable devices.",
  },
  {
    phase: "Future",
    title: "Beyond the knee",
    description: "Extending the same approach to other rehabilitation programs.",
  },
];

const Roadmap = () => {
  return (
    <section className="roadmap-root" id="roadmap">
      <div className="roadmap-container">
        <Reveal className="roadmap-header">
          <span className="roadmap-badge">What&apos;s Next</span>
          <h2 className="roadmap-title">We&apos;re just getting started.</h2>
          <p className="roadmap-description">
            KneeGuide is being built with clinics, one release at a time.
          </p>
        </Reveal>

        <div className="roadmap-timeline">
          {MILESTONES.map((item, index) => (
            <Reveal as="div" key={item.title} delay={index * 0.1} className="roadmap-item">
              <span className="roadmap-item-phase">{item.phase}</span>
              <h3 className="roadmap-item-title">{item.title}</h3>
              <p className="roadmap-item-description">{item.description}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Roadmap;
