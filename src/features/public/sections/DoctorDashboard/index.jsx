import React from "react";
import { FaCircleCheck } from "react-icons/fa6";
import Reveal from "../../components/Reveal";
import "./DoctorDashboard.css";

const POINTS = [
  "A patient roster with status at a glance",
  "A calendar for upcoming and past appointments",
  "AI-flagged reports worth a closer look first",
];

const DoctorDashboard = () => {
  return (
    <section className="doctor-preview-root">
      <div className="doctor-preview-container">
        <Reveal className="doctor-preview-copy">
          <span className="doctor-preview-badge">For Clinicians</span>
          <h2 className="doctor-preview-title">See every patient&apos;s progress at a glance.</h2>
          <p className="doctor-preview-description">
            Your patient list, calendar and reports live in one dashboard —
            reviewed in minutes, not hours.
          </p>
          <ul className="doctor-preview-points">
            {POINTS.map((point) => (
              <li key={point}>
                <FaCircleCheck aria-hidden="true" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal as="div" delay={0.15} className="doctor-preview-mock">
          <div className="doctor-preview-mock-card">
            <div className="doctor-preview-mock-header">
              <span className="doctor-preview-mock-title">Patients</span>
              <span className="doctor-preview-mock-tag">Today</span>
            </div>
            <div className="doctor-preview-mock-rows">
              <div className="doctor-preview-mock-row">
                <span className="doctor-preview-mock-dot doctor-preview-mock-dot-alert" />
                <span className="doctor-preview-mock-bar" style={{ width: "72%" }} />
              </div>
              <div className="doctor-preview-mock-row">
                <span className="doctor-preview-mock-dot doctor-preview-mock-dot-ok" />
                <span className="doctor-preview-mock-bar" style={{ width: "54%" }} />
              </div>
              <div className="doctor-preview-mock-row">
                <span className="doctor-preview-mock-dot doctor-preview-mock-dot-ok" />
                <span className="doctor-preview-mock-bar" style={{ width: "86%" }} />
              </div>
              <div className="doctor-preview-mock-row">
                <span className="doctor-preview-mock-dot doctor-preview-mock-dot-alert" />
                <span className="doctor-preview-mock-bar" style={{ width: "40%" }} />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default DoctorDashboard;
