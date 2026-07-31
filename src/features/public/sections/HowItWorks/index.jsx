import React from "react";
import Reveal from "../../components/Reveal";
import "./HowItWorks.css";

const STEPS = [
  {
    title: "Create your profile",
    description: "Sign up and connect with your doctor or clinic in a couple of minutes.",
  },
  {
    title: "Log daily progress",
    description: "Record pain levels, mobility and completed exercises right from your phone.",
  },
  {
    title: "Your doctor reviews the trends",
    description: "AI highlights meaningful changes so your clinician can review what matters.",
  },
  {
    title: "Your plan adjusts as you improve",
    description: "Exercises and appointments update based on how recovery is actually going.",
  },
];

const HowItWorks = () => {
  return (
    <section className="hiw-root">
      <div className="hiw-container">
        <Reveal className="hiw-header">
          <span className="hiw-badge">Getting Started</span>
          <h2 className="hiw-title">From first login to full recovery.</h2>
          <p className="hiw-description">
            A simple loop, repeated every day of your recovery.
          </p>
        </Reveal>

        <div className="hiw-steps">
          {STEPS.map((step, index) => (
            <Reveal as="div" key={step.title} delay={index * 0.1} className="hiw-step">
              <span className="hiw-step-number">{String(index + 1).padStart(2, "0")}</span>
              <div className="hiw-step-body">
                <h3 className="hiw-step-title">{step.title}</h3>
                <p className="hiw-step-description">{step.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
