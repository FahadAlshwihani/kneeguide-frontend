import React from "react";
import { FaCircleCheck } from "react-icons/fa6";
import Reveal from "../../components/Reveal";
import "./PatientDashboard.css";

const POINTS = [
  "A one-tap pain wheel check-in each day",
  "A clear checklist of today's exercises",
  "Your next appointment, always one tap away",
];

const CHECKLIST = [
  { label: "Heel slides", done: true },
  { label: "Quad sets", done: true },
  { label: "Straight leg raises", done: false },
];

const PatientDashboard = () => {
  return (
    <section className="patient-preview-root">
      <div className="patient-preview-container">
        <Reveal as="div" className="patient-preview-mock">
          <div className="patient-preview-mock-card">
            <div className="patient-preview-mock-header">
              <span className="patient-preview-mock-title">Today&apos;s check-in</span>
            </div>

            <div className="patient-preview-mock-dial">
              <div className="patient-preview-mock-dial-value">
                <span>3</span>
                <small>/ 10</small>
              </div>
            </div>

            <div className="patient-preview-mock-checklist">
              {CHECKLIST.map((item) => (
                <div
                  key={item.label}
                  className={`patient-preview-mock-item${item.done ? " patient-preview-mock-item-done" : ""}`}
                >
                  <span className="patient-preview-mock-check" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="patient-preview-copy">
          <span className="patient-preview-badge">For Patients</span>
          <h2 className="patient-preview-title">Recovery you can actually see.</h2>
          <p className="patient-preview-description">
            Log how you feel, follow your exercises, and watch your progress
            add up — all from your phone.
          </p>
          <ul className="patient-preview-points">
            {POINTS.map((point) => (
              <li key={point}>
                <FaCircleCheck aria-hidden="true" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
};

export default PatientDashboard;
