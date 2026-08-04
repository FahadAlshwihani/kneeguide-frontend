import React from "react";
import {
  FaClipboardList,
  FaCommentSlash,
  FaChartLine,
  FaBullseye,
  FaWandMagicSparkles,
  FaArrowTrendUp,
  FaUser,
  FaUserDoctor,
  FaPeopleGroup,
} from "react-icons/fa6";
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

const HIGHLIGHTS = [
  {
    icon: FaBullseye,
    value: "Consistent",
    title: "Exercise adherence",
    description: "Goal-focused routines designed to make daily rehabilitation easier to follow.",
  },
  {
    icon: FaWandMagicSparkles,
    value: "24/7",
    title: "AI-assisted guidance",
    description: "On-demand support that helps patients stay informed between appointments.",
  },
  {
    icon: FaArrowTrendUp,
    value: "Faster",
    title: "Recovery visibility",
    description: "Clear progress signals that help meaningful changes surface sooner.",
  },
];

const AUDIENCES = [
  { icon: FaUser, title: "Patients", description: "Clear guidance for every recovery day." },
  { icon: FaUserDoctor, title: "Clinicians", description: "Useful context between appointments." },
  { icon: FaPeopleGroup, title: "Healthcare Teams", description: "A shared view of rehabilitation progress." },
];

const Problem = () => {
  return (
    <section className="problem-root">
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

        <Reveal as="div" className="problem-highlights">
          {HIGHLIGHTS.map((item) => {
            const Icon = item.icon;
            return (
              <div className="problem-highlight" key={item.title}>
                <span className="problem-highlight-icon"><Icon aria-hidden="true" /></span>
                <strong className="problem-highlight-value">{item.value}</strong>
                <span className="problem-highlight-title">{item.title}</span>
                <p className="problem-highlight-description">{item.description}</p>
              </div>
            );
          })}
        </Reveal>

        <Reveal as="div" className="problem-trust">
          <p className="problem-trust-label">Designed around the people who move recovery forward</p>
          <div className="problem-trust-grid">
            {AUDIENCES.map((item) => {
              const Icon = item.icon;
              return (
                <div className="problem-trust-item" key={item.title}>
                  <span className="problem-trust-icon"><Icon aria-hidden="true" /></span>
                  <span>
                    <strong>Designed for {item.title}</strong>
                    <small>{item.description}</small>
                  </span>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default Problem;
