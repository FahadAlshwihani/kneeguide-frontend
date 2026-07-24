// src/pages/DoctorProfile.jsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import DoctorLayout from "../components/layout/DoctorLayout";
import "../styles/DoctorProfile.css";

// 🔥 أضف هذا السطر
import LanguageDropdown from "../components/common/LanguageDropdown";

const initialDoctor = {
  name: "Dr. Sarah Ahmed",
  specialty: "Orthopedic Surgeon - Knee & Sports Injuries",
  yearsExperience: 12,
  licenseNumber: "MOH-4589321",
  clinicName: "KneeGuide Specialized Clinic",
  email: "sarah.ahmed@kneeguide.com",
  phone: "+966 55 123 4567",
  location: "Riyadh, Saudi Arabia",
  bio: "Specialized in ACL reconstruction, meniscus injuries, and post-operative rehabilitation with a focus on evidence-based protocols.",
  availabilityStatus: "available",
  workHours: [
    "Sunday - Wednesday: 2:00 PM - 8:00 PM",
    "Thursday: 3:00 PM - 7:00 PM",
  ],
};

const DoctorProfile = () => {
  const { t } = useTranslation();
  const [form, setForm] = useState(initialDoctor);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSavedMessage("");
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);

    setTimeout(() => {
      setSaving(false);
      setSavedMessage(t("doctorProfile.saveMockMessage"));
    }, 800);
  };

  const handleReset = () => {
    setForm(initialDoctor);
    setSavedMessage("");
  };

  return (
    <DoctorLayout active="profile">
      <div className="dprof-page">

        {/* HEADER */}
        <div className="dprof-header">
          <div>
            <h1>{t("doctorProfile.title")}</h1>
            <p>{t("doctorProfile.subtitle")}</p>
          </div>

          <div className="dprof-header-meta">
            <span className="dprof-pill dprof-pill-live">
              {t("doctorProfile.liveProfile")}
            </span>
            <span className="dprof-pill-soft">
              {t("doctorProfile.lastSynced")}
            </span>
          </div>
        </div>

        {/* SUCCESS MESSAGE */}
        {savedMessage && (
          <div className="dprof-alert">
            {savedMessage}
          </div>
        )}

        {/* GRID */}
        <div className="dprof-grid">

          {/* LEFT COL */}
          <div className="dprof-col">

            {/* Avatar */}
            <div className="dprof-card dprof-card-main">
              <div className="dprof-avatar-block">
                <div className="dprof-avatar-circle">
                  {form.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>

                <div className="dprof-avatar-text">
                  <h2>{form.name}</h2>
                  <p>{form.specialty}</p>

                  <span className={`dprof-status-badge status-${form.availabilityStatus}`}>
                    {t(`doctorProfile.status.${form.availabilityStatus}`)}
                  </span>
                </div>
              </div>

              <div className="dprof-avatar-actions">
                <button type="button" className="dprof-ghost-btn">
                  {t("doctorProfile.changePhoto")}
                </button>
              </div>
            </div>

            {/* PROFESSIONAL DETAILS */}
            <div className="dprof-card">
              <div className="dprof-section-header">
                <h3>{t("doctorProfile.professionalDetails")}</h3>
                <span className="dprof-tag">
                  {t("doctorProfile.visibleToAdmins")}
                </span>
              </div>

              <div className="dprof-form-grid">

                <div className="dprof-field">
                  <label>{t("doctorProfile.labels.fullName")}</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                  />
                </div>

                <div className="dprof-field">
                  <label>{t("doctorProfile.labels.specialty")}</label>
                  <input
                    type="text"
                    name="specialty"
                    value={form.specialty}
                    onChange={handleChange}
                  />
                </div>

                <div className="dprof-field">
                  <label>{t("doctorProfile.labels.yearsExperience")}</label>
                  <input
                    type="number"
                    min="0"
                    name="yearsExperience"
                    value={form.yearsExperience}
                    onChange={handleChange}
                  />
                </div>

                <div className="dprof-field">
                  <label>{t("doctorProfile.labels.licenseNumber")}</label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={form.licenseNumber}
                    onChange={handleChange}
                  />
                </div>

                <div className="dprof-field">
                  <label>{t("doctorProfile.labels.clinicName")}</label>
                  <input
                    type="text"
                    name="clinicName"
                    value={form.clinicName}
                    onChange={handleChange}
                  />
                </div>

              </div>

              <div className="dprof-field">
                <label>{t("doctorProfile.labels.bio")}</label>
                <textarea
                  rows="4"
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  placeholder={t("doctorProfile.placeholders.bio")}
                />
              </div>
            </div>
          </div>

          {/* RIGHT COL */}
          <div className="dprof-col">

            <div className="dprof-card">
              <div className="dprof-section-header">
                <h3>{t("doctorProfile.contactAvailability")}</h3>
              </div>

              <div className="dprof-form-grid">

                <div className="dprof-field">
                  <label>{t("doctorProfile.labels.email")}</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="dprof-field">
                  <label>{t("doctorProfile.labels.phone")}</label>
                  <input
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>

                <div className="dprof-field">
                  <label>{t("doctorProfile.labels.location")}</label>
                  <input
                    type="text"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                  />
                </div>

                <div className="dprof-field">
                  <label>{t("doctorProfile.labels.availabilityStatus")}</label>
                  <select
                    name="availabilityStatus"
                    value={form.availabilityStatus}
                    onChange={handleChange}
                  >
                    <option value="available">{t("doctorProfile.status.available")}</option>
                    <option value="busy">{t("doctorProfile.status.busy")}</option>
                    <option value="away">{t("doctorProfile.status.away")}</option>
                  </select>
                </div>

              </div>

              <div className="dprof-workhours">
                <h4>{t("doctorProfile.workHoursTitle")}</h4>

                <ul>
                  {form.workHours.map((line, idx) => (
                    <li key={idx}>{line}</li>
                  ))}
                </ul>

                <p className="dprof-note">
                  {t("doctorProfile.workHoursNote")}
                </p>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="dprof-card dprof-actions-card">
              <div className="dprof-actions-header">
                <h3>{t("doctorProfile.saveChangesTitle")}</h3>
                <p>{t("doctorProfile.saveChangesSubtitle")}</p>
              </div>

              <div className="dprof-actions-buttons">
                <button
                  className="dprof-primary-btn"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? t("doctorProfile.saving") : t("doctorProfile.saveProfile")}
                </button>

                <button
                  type="button"
                  className="dprof-ghost-btn"
                  onClick={handleReset}
                  disabled={saving}
                >
                  {t("doctorProfile.reset")}
                </button>
              </div>

              <p className="dprof-small-note">
                {t("doctorProfile.mockNote")}
              </p>
            </div>

          </div>
        </div>
      </div>
    </DoctorLayout>
  );
};

export default DoctorProfile;
