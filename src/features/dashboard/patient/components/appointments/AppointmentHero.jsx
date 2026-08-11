import React from "react";
import { useTranslation } from "react-i18next";
import { LuCalendarPlus } from "react-icons/lu";
import PatientButton from "../PatientButton";
import "./AppointmentHero.css";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// A safe, purely client-side .ics download — no backend, no external
// calendar API. Built from fields already on the appointment object;
// never fabricates anything not already shown on screen.
const buildCalendarFile = (appointment, t) => {
  const format = (date) => date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const summary = `${t(appointment.typeKey)} — ${appointment.clinician.name}`;
  const location = t(appointment.location.nameKey);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//KneeGuide//Patient Appointments//EN",
    "BEGIN:VEVENT",
    `UID:${appointment.id}@kneeguide`,
    `DTSTAMP:${format(new Date())}`,
    `DTSTART:${format(appointment.startAt)}`,
    `DTEND:${format(appointment.endAt)}`,
    `SUMMARY:${summary}`,
    `LOCATION:${location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return new Blob([lines.join("\r\n")], { type: "text/calendar" });
};

/**
 * The confirmed NEXT appointment — the page's highest-priority moment
 * (Section 9). No Reschedule/Cancel here (never implemented this round,
 * per Section 9's own explicit boundary) — only "View details" and an
 * optional, safely client-side "Add to calendar".
 */
const AppointmentHero = ({ appointment, onViewDetails, onRequestClick, now = new Date() }) => {
  const { t, i18n } = useTranslation();

  if (!appointment) {
    return (
      <section className="appointment-hero appointment-hero--empty" aria-labelledby="appointment-hero-heading">
        <h2 id="appointment-hero-heading" className="appointment-hero-eyebrow">
          {t("patientAppointments.hero.title")}
        </h2>
        <p className="appointment-hero-empty-text">{t("patientAppointments.hero.emptyText")}</p>
        <PatientButton type="button" variant="primary" onClick={onRequestClick}>
          {t("patientAppointments.request.cta")}
        </PatientButton>
      </section>
    );
  }

  const daysAway = Math.max(0, Math.ceil((appointment.startAt - now) / MS_PER_DAY));

  const handleAddToCalendar = () => {
    const blob = buildCalendarFile(appointment, t);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "kneeguide-appointment.ics";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="appointment-hero" aria-labelledby="appointment-hero-heading">
      <h2 id="appointment-hero-heading" className="appointment-hero-eyebrow">
        {t("patientAppointments.hero.title")}
      </h2>

      <p className="appointment-hero-date" dir="ltr">
        {appointment.startAt.toLocaleDateString(i18n.language, { weekday: "long", month: "short", day: "numeric" })}
      </p>
      <p className="appointment-hero-time" dir="ltr">
        {appointment.startAt.toLocaleTimeString(i18n.language, { hour: "2-digit", minute: "2-digit" })}
      </p>

      <p className="appointment-hero-clinician">{appointment.clinician.name}</p>
      <p className="appointment-hero-type">{t(appointment.typeKey)}</p>
      <p className="appointment-hero-location">
        {t(appointment.location.nameKey)}
        {appointment.location.room ? ` · ${t("patientAppointments.location.room", { room: appointment.location.room })}` : ""}
      </p>

      <p className="appointment-hero-countdown">
        {daysAway === 0 ? t("patientAppointments.hero.today") : t("patientAppointments.hero.daysAway", { count: daysAway })}
      </p>

      <div className="appointment-hero-actions">
        <PatientButton type="button" variant="primary" onClick={() => onViewDetails(appointment)}>
          {t("patientAppointments.viewDetails")}
        </PatientButton>
        <PatientButton type="button" variant="outline" icon={<LuCalendarPlus aria-hidden="true" />} onClick={handleAddToCalendar}>
          {t("patientAppointments.hero.addToCalendar")}
        </PatientButton>
      </div>
    </section>
  );
};

export default AppointmentHero;
