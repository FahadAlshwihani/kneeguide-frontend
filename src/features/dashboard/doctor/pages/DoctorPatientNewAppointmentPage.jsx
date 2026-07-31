// src/pages/DoctorPatientNewAppointmentPage.jsx
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import DoctorLayout from "../components/DoctorLayout";
import "../styles/DoctorReports.css";
import "../styles/DoctorAppointmentForm.css";

import { useTranslation } from "react-i18next";

const DoctorPatientNewAppointmentPage = () => {
  const { id } = useParams();
  const { t } = useTranslation();

  const [form, setForm] = useState({
    date: "",
    time: "",
    type: "Follow-up",
    notes: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <DoctorLayout active="patients">
      <div className="reports-page">
        <div className="reports-wrapper">

          {/* HEADER */}
          <div className="reports-header">
            <h1>{t("doctorNewAppointment.header.title")}</h1>
            <p>
              {t("doctorNewAppointment.header.subtitle")} {id}
            </p>
          </div>

          {/* MAIN */}
          <div className="reports-main">
            <div className="reports-table-card">
              <div className="card-header">
                <h2>{t("doctorNewAppointment.section.title")}</h2>
                <p>{t("doctorNewAppointment.section.subtitle")}</p>
              </div>

              <form className="appointment-form">

                {/* Date */}
                <label className="form-label">
                  {t("doctorNewAppointment.form.date")}
                </label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  className="form-input"
                />

                {/* Time */}
                <label className="form-label">
                  {t("doctorNewAppointment.form.time")}
                </label>
                <input
                  type="time"
                  name="time"
                  value={form.time}
                  onChange={handleChange}
                  className="form-input"
                />

                {/* Visit type */}
                <label className="form-label">
                  {t("doctorNewAppointment.form.visitType")}
                </label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="Initial Assessment">
                    {t("doctorNewAppointment.types.initial")}
                  </option>
                  <option value="Follow-up">
                    {t("doctorNewAppointment.types.follow")}
                  </option>
                  <option value="Rehab Session">
                    {t("doctorNewAppointment.types.rehab")}
                  </option>
                </select>

                {/* Notes */}
                <label className="form-label">
                  {t("doctorNewAppointment.form.notes")}
                </label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  className="form-input"
                  rows={5}
                ></textarea>

                <button className="dp-btn-primary" style={{ marginTop: 20 }}>
                  {t("doctorNewAppointment.form.submit")}
                </button>

              </form>
            </div>
          </div>

        </div>
      </div>
    </DoctorLayout>
  );
};

export default DoctorPatientNewAppointmentPage;
