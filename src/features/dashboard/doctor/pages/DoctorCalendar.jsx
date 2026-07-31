// src/pages/DoctorCalendar.jsx
import React, { useMemo, useState } from "react";
import DoctorLayout from "../components/DoctorLayout";
import "../styles/DoctorCalendar.css";
import { useTranslation } from "react-i18next";

const initialEvents = [
  {
    id: "EV-1001",
    title: "ACL follow-up",
    patientName: "Ahmed Ali",
    type: "followUp",
    date: "2025-11-18",
    start: "09:30",
    end: "10:00",
    status: "confirmed",
    location: "Room 4",
    note: "Check quad strength and gait.",
  },
  {
    id: "EV-1002",
    title: "Initial Assessment",
    patientName: "Sara Almutairi",
    type: "initial",
    date: "2025-11-18",
    start: "11:00",
    end: "11:45",
    status: "pending",
    location: "Room 2",
    note: "Suspected meniscus involvement.",
  },
  {
    id: "EV-1003",
    title: "Post-op review",
    patientName: "Mohammed Aziz",
    type: "postOp",
    date: "2025-11-19",
    start: "14:00",
    end: "14:30",
    status: "confirmed",
    location: "Room 3",
    note: "Day 5 post-op, adjust pain meds.",
  },
  {
    id: "EV-1004",
    title: "Rehab session",
    patientName: "Ruba Salem",
    type: "rehab",
    date: "2025-11-20",
    start: "16:00",
    end: "16:45",
    status: "cancelled",
    location: "Gym A",
    note: "Cancelled by patient.",
  },
  {
    id: "EV-1005",
    title: "Progress check",
    patientName: "Fahad Alotaibi",
    type: "check",
    date: "2025-11-22",
    start: "10:30",
    end: "11:00",
    status: "confirmed",
    location: "Room 1",
    note: "ROM improving, update program.",
  },
];

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const DoctorCalendar = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const [currentDate, setCurrentDate] = useState(new Date("2025-11-18"));
  const [viewMode, setViewMode] = useState("month");
  const [selectedDate, setSelectedDate] = useState("2025-11-18");
  const [events, setEvents] = useState(initialEvents);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [newEvent, setNewEvent] = useState({
    title: "",
    patientName: "",
    date: "2025-11-18",
    start: "10:00",
    end: "10:30",
    type: "followUp",
    status: "confirmed",
    location: "",
    note: "",
  });

  const daysOfWeek = [
    t("calendar.weekdays.sun"),
    t("calendar.weekdays.mon"),
    t("calendar.weekdays.tue"),
    t("calendar.weekdays.wed"),
    t("calendar.weekdays.thu"),
    t("calendar.weekdays.fri"),
    t("calendar.weekdays.sat")
  ];

  const monthLabel = currentDate.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
    month: "long",
    year: "numeric",
  });

  // Build 42-day grid (6 weeks)
  const monthGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const firstDayOfWeek = firstOfMonth.getDay();
    const gridStart = new Date(year, month, 1 - firstDayOfWeek);
    const cells = [];

    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);

      const key = formatDateKey(d);
      const isCurrentMonth = d.getMonth() === month;
      const isToday = key === formatDateKey(new Date());

      const dayEvents = events.filter((ev) => ev.date === key);

      cells.push({
        dateObj: d,
        key,
        isCurrentMonth,
        isToday,
        events: dayEvents,
      });
    }

    return cells;
  }, [currentDate, events]);

  const eventsForSelectedDate = events
    .filter((ev) => ev.date === selectedDate)
    .sort((a, b) => (a.start > b.start ? 1 : -1));

  const agendaGroups = useMemo(() => {
    const map = {};
    events.forEach((ev) => {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    });

    Object.keys(map).forEach((k) => {
      map[k].sort((a, b) => (a.start > b.start ? 1 : -1));
    });

    return Object.keys(map)
      .sort((a, b) => (a > b ? 1 : -1))
      .map((date) => ({ date, events: map[date] }));
  }, [events]);


  const openCreateModal = () => {
    setNewEvent((prev) => ({
      ...prev,
      date: selectedDate,
    }));
    setIsCreateOpen(true);
  };

  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setNewEvent((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.patientName) return;

    const id = `EV-${Math.floor(Math.random() * 9000) + 1000}`;

    setEvents((prev) => [...prev, { id, ...newEvent }]);
    setIsCreateOpen(false);

    setNewEvent({
      title: "",
      patientName: "",
      date: selectedDate,
      start: "10:00",
      end: "10:30",
      type: "followUp",
      status: "confirmed",
      location: "",
      note: "",
    });
  };

  const statusLabel = (st) => t(`calendar.status.${st}`);
  const typeLabel = (tp) => t(`calendar.types.${tp}`);

  const formatNiceDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <DoctorLayout active="appointments">
      <div className="dc-page">
        <div className="dc-wrapper">

          {/* HEADER */}
          <div className="dc-header">
            <div>
              <h1>{t("calendar.header.title")}</h1>
              <p>{t("calendar.header.subtitle")}</p>
            </div>

            <div className="dc-header-controls">
              <span className="dc-pill">
                {t("calendar.header.totalEvents")}: {events.length}
              </span>
              <button className="dc-primary-btn" onClick={openCreateModal}>
                {t("calendar.header.newAppointment")}
              </button>
            </div>
          </div>

          {/* CONTROLS */}
          <div className="dc-controls-row">
            <div className="dc-month-nav">
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="dc-nav-btn">
                {t("calendar.controls.prev")}
              </button>

              <span className="dc-month-label">{monthLabel}</span>

              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="dc-nav-btn">
                {t("calendar.controls.next")}
              </button>
            </div>

            <div className="dc-view-toggle">
              <button
                className={viewMode === "month" ? "active" : ""}
                onClick={() => setViewMode("month")}
              >
                {t("calendar.controls.month")}
              </button>

              <button
                className={viewMode === "agenda" ? "active" : ""}
                onClick={() => setViewMode("agenda")}
              >
                {t("calendar.controls.agenda")}
              </button>
            </div>
          </div>

          {/* MAIN LAYOUT */}
          <div className="dc-main-layout">

            {/* CALENDAR */}
            <div className="dc-calendar-card">
              {viewMode === "month" && (
                <>
                  <div className="dc-weekdays-row">
                    {daysOfWeek.map((d) => (
                      <div key={d} className="dc-weekday">{d}</div>
                    ))}
                  </div>

                  <div className="dc-grid">
                    {monthGrid.map((cell) => (
                      <div
                        key={cell.key}
                        className={[
                          "dc-day-cell",
                          !cell.isCurrentMonth ? "dc-day-muted" : "",
                          cell.isToday ? "dc-day-today" : "",
                          cell.key === selectedDate ? "dc-day-selected" : "",
                        ].join(" ")}
                        onClick={() => setSelectedDate(cell.key)}
                      >
                        <div className="dc-day-number">
                          {cell.dateObj.getDate()}
                        </div>

                        <div className="dc-events-mini">
                          {cell.events.slice(0, 3).map((ev) => (
                            <div
                              key={ev.id}
                              className={`dc-event-chip dc-event-chip-${ev.status}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEvent(ev);
                              }}
                            >
                              <span className="dc-event-dot" />
                              <span className="dc-event-chip-time">{ev.start}</span>
                              <span className="dc-event-chip-title">{ev.title}</span>
                            </div>
                          ))}

                          {cell.events.length > 3 && (
                            <div className="dc-more-chip">
                              +{cell.events.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* AGENDA */}
              {viewMode === "agenda" && (
                <div className="dc-agenda">
                  {agendaGroups.length === 0 && (
                    <div className="dc-empty">{t("calendar.agenda.empty")}</div>
                  )}

                  {agendaGroups.map((group) => (
                    <div key={group.date} className="dc-agenda-day">
                      <div className="dc-agenda-date">
                        {formatNiceDate(group.date)}
                      </div>

                      {group.events.map((ev) => (
                        <div
                          key={ev.id}
                          className="dc-agenda-item"
                          onClick={() => setSelectedEvent(ev)}
                        >
                          <div className="dc-agenda-main">
                            <span className="dc-agenda-time">
                              {ev.start} – {ev.end}
                            </span>
                            <span className="dc-agenda-title">
                              {ev.title} · {ev.patientName}
                            </span>
                          </div>

                          <span className={`dc-chip dc-chip-${ev.status}`}>
                            {statusLabel(ev.status)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SIDE PANEL */}
            <div className="dc-side-panel">

              {/* Selected day */}
              <div className="dc-side-card">
                <div className="dc-side-header">
                  <h2>{t("calendar.sidepanel.selectedDay")}</h2>
                  <span className="dc-side-date">
                    {formatNiceDate(selectedDate)}
                  </span>
                </div>

                <div className="dc-side-events-list">
                  {eventsForSelectedDate.length === 0 && (
                    <div className="dc-empty">
                      {t("calendar.sidepanel.noEvents")}
                    </div>
                  )}

                  {eventsForSelectedDate.map((ev) => (
                    <div
                      key={ev.id}
                      className="dc-side-event-row"
                      onClick={() => setSelectedEvent(ev)}
                    >
                      <div>
                        <div className="dc-side-event-time">
                          {ev.start} – {ev.end}
                        </div>
                        <div className="dc-side-event-title">{ev.title}</div>
                        <div className="dc-side-event-patient">{ev.patientName}</div>
                      </div>

                      <span className={`dc-chip dc-chip-${ev.status}`}>
                        {statusLabel(ev.status)}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  className="dc-secondary-btn"
                  onClick={openCreateModal}
                >
                  {t("calendar.sidepanel.addAppointment")}
                </button>
              </div>

              {/* Summary */}
              <div className="dc-side-card dc-side-summary">
                <h2>{t("calendar.sidepanel.summary")}</h2>
                <ul className="dc-summary-list">
                  <li>
                    <span>{t("calendar.sidepanel.confirmed")}</span>
                    <span>{events.filter((e) => e.status === "confirmed").length}</span>
                  </li>
                  <li>
                    <span>{t("calendar.sidepanel.pending")}</span>
                    <span>{events.filter((e) => e.status === "pending").length}</span>
                  </li>
                  <li>
                    <span>{t("calendar.sidepanel.cancelled")}</span>
                    <span>{events.filter((e) => e.status === "cancelled").length}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* EVENT DETAILS MODAL */}
          {selectedEvent && (
            <div
              className="dc-modal-backdrop"
              onClick={() => setSelectedEvent(null)}
            >
              <div className="dc-modal" onClick={(e) => e.stopPropagation()}>
                <div className="dc-modal-header">
                  <div>
                    <h2>{selectedEvent.title}</h2>
                    <p>
                      {selectedEvent.patientName} ·{" "}
                      {formatNiceDate(selectedEvent.date)}
                    </p>
                  </div>
                  <button className="dc-modal-close" onClick={() => setSelectedEvent(null)}>
                    ✕
                  </button>
                </div>

                <div className="dc-modal-tags">
                  <span className={`dc-chip dc-chip-${selectedEvent.status}`}>
                    {statusLabel(selectedEvent.status)}
                  </span>

                  <span className="dc-chip dc-chip-soft">
                    {selectedEvent.start} – {selectedEvent.end}
                  </span>

                  <span className="dc-chip dc-chip-soft">
                    {typeLabel(selectedEvent.type)}
                  </span>
                </div>

                <div className="dc-modal-body">
                  <ul className="dc-details-list">
                    <li>
                      <span>{t("calendar.modal.details.location")}</span>
                      <span>{selectedEvent.location}</span>
                    </li>
                    <li>
                      <span>{t("calendar.modal.details.date")}</span>
                      <span>{selectedEvent.date}</span>
                    </li>
                    <li>
                      <span>{t("calendar.modal.details.patient")}</span>
                      <span>{selectedEvent.patientName}</span>
                    </li>
                  </ul>

                  <div className="dc-modal-section">
                    <h3>{t("calendar.modal.notesTitle")}</h3>
                    <p>
                      {selectedEvent.note || t("calendar.modal.notesEmpty")}
                    </p>
                  </div>
                </div>

                <div className="dc-modal-footer">
                  <button
                    className="dc-ghost-btn"
                    onClick={() => setSelectedEvent(null)}
                  >
                    {t("calendar.modal.close")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CREATE MODAL */}
          {isCreateOpen && (
            <div
              className="dc-modal-backdrop"
              onClick={() => setIsCreateOpen(false)}
            >
              <div className="dc-modal" onClick={(e) => e.stopPropagation()}>
                <div className="dc-modal-header">
                  <div>
                    <h2>{t("calendar.createModal.title")}</h2>
                    <p>{t("calendar.createModal.subtitle")}</p>
                  </div>

                  <button
                    className="dc-modal-close"
                    onClick={() => setIsCreateOpen(false)}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateSubmit} className="dc-form">
                  <div className="dc-form-grid">

                    <div className="dc-form-group">
                      <label>{t("calendar.createModal.form.title")}</label>
                      <input
                        type="text"
                        name="title"
                        value={newEvent.title}
                        onChange={handleCreateChange}
                        placeholder={t("calendar.createModal.form.titlePlaceholder")}
                      />
                    </div>

                    <div className="dc-form-group">
                      <label>{t("calendar.createModal.form.patientName")}</label>
                      <input
                        type="text"
                        name="patientName"
                        value={newEvent.patientName}
                        onChange={handleCreateChange}
                        placeholder={t("calendar.createModal.form.patientPlaceholder")}
                      />
                    </div>

                    <div className="dc-form-group">
                      <label>{t("calendar.createModal.form.date")}</label>
                      <input
                        type="date"
                        name="date"
                        value={newEvent.date}
                        onChange={handleCreateChange}
                      />
                    </div>

                    <div className="dc-form-group">
                      <label>{t("calendar.createModal.form.start")}</label>
                      <input
                        type="time"
                        name="start"
                        value={newEvent.start}
                        onChange={handleCreateChange}
                      />
                    </div>

                    <div className="dc-form-group">
                      <label>{t("calendar.createModal.form.end")}</label>
                      <input
                        type="time"
                        name="end"
                        value={newEvent.end}
                        onChange={handleCreateChange}
                      />
                    </div>

                    <div className="dc-form-group">
                      <label>{t("calendar.createModal.form.type")}</label>
                      <select
                        name="type"
                        value={newEvent.type}
                        onChange={handleCreateChange}
                      >
                        <option value="followUp">{t("calendar.types.followUp")}</option>
                        <option value="initial">{t("calendar.types.initial")}</option>
                        <option value="postOp">{t("calendar.types.postOp")}</option>
                        <option value="rehab">{t("calendar.types.rehab")}</option>
                        <option value="check">{t("calendar.types.check")}</option>
                      </select>
                    </div>

                    <div className="dc-form-group">
                      <label>{t("calendar.createModal.form.status")}</label>
                      <select
                        name="status"
                        value={newEvent.status}
                        onChange={handleCreateChange}
                      >
                        <option value="confirmed">{t("calendar.status.confirmed")}</option>
                        <option value="pending">{t("calendar.status.pending")}</option>
                        <option value="cancelled">{t("calendar.status.cancelled")}</option>
                      </select>
                    </div>

                    <div className="dc-form-group">
                      <label>{t("calendar.createModal.form.location")}</label>
                      <input
                        type="text"
                        name="location"
                        value={newEvent.location}
                        onChange={handleCreateChange}
                        placeholder={t("calendar.createModal.form.locationPlaceholder")}
                      />
                    </div>
                  </div>

                  <div className="dc-form-group">
                    <label>{t("calendar.createModal.form.notes")}</label>
                    <textarea
                      name="note"
                      rows="3"
                      value={newEvent.note}
                      onChange={handleCreateChange}
                      placeholder={t("calendar.createModal.form.notesPlaceholder")}
                    />
                  </div>

                  <div className="dc-modal-footer">
                    <button
                      type="button"
                      className="dc-ghost-btn"
                      onClick={() => setIsCreateOpen(false)}
                    >
                      {t("calendar.createModal.buttons.cancel")}
                    </button>

                    <button type="submit" className="dc-primary-btn">
                      {t("calendar.createModal.buttons.save")}
                    </button>
                  </div>

                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </DoctorLayout>
  );
};

export default DoctorCalendar;
