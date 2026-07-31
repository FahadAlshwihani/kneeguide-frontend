import React from "react";
import { FaListCheck, FaCalendarCheck, FaHeartPulse, FaChartColumn } from "react-icons/fa6";
import Reveal from "../../components/Reveal";
import "./Platform.css";

const CAPABILITIES = [
  {
    icon: FaHeartPulse,
    title: "Daily pain tracking",
    description: "A quick pain wheel check-in captures location and intensity in seconds.",
  },
  {
    icon: FaListCheck,
    title: "Guided exercise library",
    description: "Prescribed exercises with clear instructions patients can follow at home.",
  },
  {
    icon: FaCalendarCheck,
    title: "Appointment scheduling",
    description: "Book, reschedule and track upcoming visits without a phone call.",
  },
  {
    icon: FaChartColumn,
    title: "Progress reports",
    description: "A running history of pain, mobility and exercise completion over time.",
  },
];

const Platform = () => {
  return (
    <section className="platform-root">
      <div className="platform-container">
        <Reveal className="platform-header">
          <span className="platform-badge">The Platform</span>
          <h2 className="platform-title">Everything recovery needs, in one place.</h2>
          <p className="platform-description">
            One connected platform for the day-to-day of rehabilitation —
            built around what patients and clinicians actually use.
          </p>
        </Reveal>

        <div className="platform-list">
          {CAPABILITIES.map((item, index) => {
            const Icon = item.icon;
            return (
              <Reveal as="div" key={item.title} delay={index * 0.08} className="platform-row">
                <span className="platform-row-icon">
                  <Icon aria-hidden="true" />
                </span>
                <div className="platform-row-body">
                  <h3 className="platform-row-title">{item.title}</h3>
                  <p className="platform-row-description">{item.description}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Platform;
