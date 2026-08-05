import React from "react";
import { useTranslation } from "react-i18next";
import { FaCircleCheck } from "react-icons/fa6";
import Reveal from "../../components/Reveal";
import "./DoctorDashboard.css";

const POINT_KEYS = ["roster", "calendar", "flagged"];

const DoctorDashboard = () => {
  const { t } = useTranslation();

  return (
    <section className="doctor-preview-root" id="doctor-dashboard">
      <div className="doctor-preview-container">
        <Reveal className="doctor-preview-copy">
          <span className="doctor-preview-badge">{t("publicDoctorDashboard.badge")}</span>
          <h2 className="doctor-preview-title">{t("publicDoctorDashboard.title")}</h2>
          <p className="doctor-preview-description">{t("publicDoctorDashboard.description")}</p>
          <ul className="doctor-preview-points">
            {POINT_KEYS.map((key) => (
              <li key={key}>
                <FaCircleCheck aria-hidden="true" />
                <span>{t(`publicDoctorDashboard.points.${key}`)}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal as="div" delay={0.15} className="doctor-preview-mock">
          <div className="doctor-preview-mock-card">
            <div className="doctor-preview-mock-header">
              <span className="doctor-preview-mock-title">{t("publicDoctorDashboard.mock.title")}</span>
              <span className="doctor-preview-mock-tag">{t("publicDoctorDashboard.mock.tag")}</span>
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
