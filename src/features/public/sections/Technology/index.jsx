import React from "react";
import { FaCube, FaBrain, FaShieldHeart, FaArrowsRotate } from "react-icons/fa6";
import Reveal from "../../components/Reveal";
import "./Technology.css";

const TECH = [
  {
    icon: FaCube,
    title: "Interactive 3D knee modeling",
    description: "Visualize range of motion and exercise mechanics in 3D, not static diagrams.",
  },
  {
    icon: FaBrain,
    title: "AI pain-pattern analysis",
    description: "Machine learning surfaces trends across weeks of pain and mobility logs.",
  },
  {
    icon: FaShieldHeart,
    title: "Secure, clinical-grade data",
    description: "Patient data is encrypted end-to-end and handled to clinical privacy standards.",
  },
  {
    icon: FaArrowsRotate,
    title: "Real-time sync",
    description: "Every log a patient submits reaches their care team instantly.",
  },
];

const Technology = () => {
  return (
    <section className="tech-root">
      <div className="tech-container">
        <Reveal className="tech-header">
          <span className="tech-badge">Built On</span>
          <h2 className="tech-title">Modern technology, purpose-built for rehabilitation.</h2>
          <p className="tech-description">
            KneeGuide combines interactive 3D modeling with applied machine
            learning to make recovery measurable.
          </p>
        </Reveal>

        <div className="tech-grid">
          {TECH.map((item, index) => {
            const Icon = item.icon;
            return (
              <Reveal as="div" key={item.title} delay={index * 0.08} className="tech-card">
                <span className="tech-icon">
                  <Icon aria-hidden="true" />
                </span>
                <h3 className="tech-card-title">{item.title}</h3>
                <p className="tech-card-description">{item.description}</p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Technology;
