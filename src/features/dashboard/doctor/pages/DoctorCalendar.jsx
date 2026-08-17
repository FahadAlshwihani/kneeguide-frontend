import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LuChevronLeft, LuChevronRight, LuPlus } from "react-icons/lu";
import DoctorLayout from "../components/DoctorLayout";
import DoctorModal from "../components/workspace/DoctorModal";
import DoctorAppointmentComposer from "../components/workspace/DoctorAppointmentComposer";
import ProposeAlternativeModal from "../components/workspace/ProposeAlternativeModal";
import DeclineAppointmentModal from "../components/workspace/DeclineAppointmentModal";
import AssistantInsightCard from "../components/workspace/AssistantInsightCard";
import { useRehabAppointments, rehabRepository } from "../../../../domain/rehab/useRehabDomain";
import { APPOINTMENT_STATUS, APPOINTMENT_SOURCE } from "../../../../domain/rehab/rehabEnums";
import { getPendingAppointmentRequests, getPrioritizedPendingAppointmentRequest } from "../assistant/doctorClinicalInsights";
import { buildAppointmentsPageInsight } from "../assistant/doctorAssistantInsights";
import { ROUTES } from "../../../../utils/routes";
import "../styles/DoctorCalendar.css";

/**
 * Doctor Appointments (Global Calendar) — rebuilt on the SAME canonical
 * rehab domain every other Doctor/Patient/Assistant surface already reads
 * (src/domain/rehab/). There is no independent event array here: every
 * appointment rendered comes straight from `useRehabAppointments()`
 * (a reactive wrapper over `rehabRepository.getAllAppointments()`), the
 * exact same records the Patient's own Appointments page and this
 * patient's Workspace "Appointments" tab render. Creating, accepting,
 * declining, proposing, or cancelling here calls the exact same
 * `rehabRepository` mutations those surfaces use — there is only one
 * appointment workflow in the product, viewed from three places.
 */

const STATUS_TONE = {
  [APPOINTMENT_STATUS.REQUESTED]: "pending",
  [APPOINTMENT_STATUS.CONFIRMED]: "confirmed",
  [APPOINTMENT_STATUS.ALTERNATIVE_PROPOSED]: "proposed",
  [APPOINTMENT_STATUS.DECLINED]: "declined",
  [APPOINTMENT_STATUS.CANCELLED]: "cancelled",
  [APPOINTMENT_STATUS.COMPLETED]: "completed",
};

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const startOfDay = (date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const buildMonthGrid = (currentDate) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const gridStart = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const cellDate = new Date(gridStart);
    cellDate.setDate(gridStart.getDate() + index);
    return cellDate;
  });
};

const DoctorCalendar = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState("month");
  const [selectedDate, setSelectedDate] = useState(() => formatDateKey(new Date()));
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);

  const [composerOpen, setComposerOpen] = useState(false);
  const [composerPatientId, setComposerPatientId] = useState(null);
  const [proposing, setProposing] = useState(null);
  const [declining, setDeclining] = useState(null);

  const allAppointments = useRehabAppointments();

  const appointments = useMemo(
    () => allAppointments.map((appointment) => ({ ...appointment, patient: rehabRepository.getPatient(appointment.patientId) })),
    [allAppointments]
  );

  // Deep links from the Doctor Assistant (Section 17/18) — "Schedule an
  // appointment" opens THIS SAME composer prefilled with the chosen
  // canonical patient; a pending-request reply opens THIS SAME details
  // view for a specific appointment. Consumed once, then stripped from the
  // URL so a refresh doesn't reopen them.
  useEffect(() => {
    const composeFor = searchParams.get("composeFor");
    const openAppointment = searchParams.get("openAppointment");
    if (!composeFor && !openAppointment) return;

    if (composeFor && rehabRepository.getPatient(composeFor)) {
      setComposerPatientId(composeFor);
      setComposerOpen(true);
    }
    if (openAppointment) {
      const target = rehabRepository.getAppointmentById(openAppointment);
      if (target) {
        setCurrentDate(new Date(target.startAt));
        setSelectedDate(formatDateKey(new Date(target.startAt)));
        setSelectedAppointmentId(openAppointment);
      }
    }
    const next = new URLSearchParams(searchParams);
    next.delete("composeFor");
    next.delete("openAppointment");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const monthGrid = useMemo(() => buildMonthGrid(currentDate), [currentDate]);
  const weekdayLabels = useMemo(
    () => t("doctorAppointments.weekdaysShort", { returnObjects: true }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, i18n.language]
  );

  const monthLabel = currentDate.toLocaleDateString(i18n.language, { month: "long", year: "numeric" });
  const todayKey = formatDateKey(new Date());

  const eventsByDateKey = useMemo(() => {
    const map = new Map();
    appointments.forEach((appointment) => {
      const key = formatDateKey(new Date(appointment.startAt));
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(appointment);
    });
    map.forEach((list) => list.sort((a, b) => new Date(a.startAt) - new Date(b.startAt)));
    return map;
  }, [appointments]);

  const selectedDayAppointments = eventsByDateKey.get(selectedDate) || [];
  const selectedAppointment = appointments.find((appointment) => appointment.id === selectedAppointmentId) || null;

  // Reads the shared store directly rather than deriving from the
  // already-fetched `appointments` array — `appointments` is only the
  // recompute trigger (a fresh reference each time the store changes).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pendingRequests = useMemo(() => getPendingAppointmentRequests(), [appointments]);

  // The Assistant card's own cross-patient inputs (Section 2 of the
  // Assistant-integration brief) — `topRequest` ranked by each requester's
  // real canonical priority (getPrioritizedPendingAppointmentRequest, which
  // itself just reuses rehabRepository.getPatientBundle's already-derived
  // priority — no new severity system), `todayAppointmentsForInsight`
  // filtered from the SAME already-patient-enriched `appointments` this
  // page already computed above (never a second, differently-shaped fetch).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const topRequest = useMemo(() => getPrioritizedPendingAppointmentRequest(), [appointments]);
  const todayAppointmentsForInsight = useMemo(
    () => appointments.filter((appointment) => formatDateKey(new Date(appointment.startAt)) === todayKey),
    [appointments, todayKey]
  );

  const monthAppointments = useMemo(
    () =>
      appointments.filter((appointment) => {
        const d = new Date(appointment.startAt);
        return d.getFullYear() === currentDate.getFullYear() && d.getMonth() === currentDate.getMonth();
      }),
    [appointments, currentDate]
  );

  const monthSummary = useMemo(() => {
    const counts = { requested: 0, confirmed: 0, alternativeProposed: 0, declined: 0, cancelled: 0, completed: 0 };
    monthAppointments.forEach((appointment) => {
      counts[STATUS_TONE[appointment.status] === "pending" ? "requested" : STATUS_TONE[appointment.status]] += 1;
    });
    return counts;
  }, [monthAppointments]);

  const agendaGroups = useMemo(() => {
    const now = startOfDay(new Date());
    const tomorrowKey = formatDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
    const upcoming = appointments
      .filter((appointment) => new Date(appointment.startAt) >= now)
      .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));

    const groups = { today: [], tomorrow: [], upcoming: [] };
    upcoming.forEach((appointment) => {
      const key = formatDateKey(new Date(appointment.startAt));
      if (key === todayKey) groups.today.push(appointment);
      else if (key === tomorrowKey) groups.tomorrow.push(appointment);
      else groups.upcoming.push(appointment);
    });
    return groups;
  }, [appointments, todayKey]);

  const goToPrevMonth = () => setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const goToNextMonth = () => setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  const openDetails = (appointment) => setSelectedAppointmentId(appointment.id);
  const closeDetails = () => setSelectedAppointmentId(null);

  const openComposer = (patientId = null) => {
    setComposerPatientId(patientId);
    setComposerOpen(true);
  };

  const openProposeFor = (appointment) => {
    closeDetails();
    setProposing(appointment);
  };
  const openDeclineFor = (appointment) => {
    closeDetails();
    setDeclining(appointment);
  };
  const acceptAppointment = (id) => {
    rehabRepository.confirmAppointment(id);
  };
  const cancelAppointment = (id) => {
    rehabRepository.cancelAppointment(id);
    closeDetails();
  };

  const timeFormatter = new Intl.DateTimeFormat(i18n.language, { hour: "2-digit", minute: "2-digit" });
  const dateTimeFormatter = new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium", timeStyle: "short" });
  const formatInsightDateTime = (isoString, { timeOnly = false } = {}) =>
    timeOnly ? timeFormatter.format(new Date(isoString)) : dateTimeFormatter.format(new Date(isoString));

  // The compact KneeGuide Assistant card (Section 2-4 of the Assistant-
  // integration brief) — reuses the SAME `AssistantInsightCard` component
  // the Patient Workspace already established (Orb "face" + content, one
  // restrained severity accent, RTL-safe via flex-direction: row), fed by
  // the pure `buildAppointmentsPageInsight` derivation above. `actionIds`
  // are semantic strings the derivation returns; they're mapped onto this
  // page's own existing handlers right here — Accept/Propose/Decline call
  // the exact same rehabRepository mutations the Requests rail uses,
  // "Schedule appointment" opens the exact same composer, "Open patient"
  // is a real navigation. No second mutation path, no second form.
  const appointmentsInsight = useMemo(
    () => buildAppointmentsPageInsight({ topRequest, todayAppointments: todayAppointmentsForInsight, formatDateTime: formatInsightDateTime }),
    // formatInsightDateTime is a fresh closure every render (it just wraps
    // the two Intl formatters above) — including it would defeat the memo
    // without changing behavior, since it never captures anything that
    // outlives this render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [topRequest, todayAppointmentsForInsight, i18n.language]
  );

  const ACTION_BUILDERS = {
    reviewRequest: () => ({
      id: "reviewRequest",
      labelKey: "doctorAppointments.assistant.actions.reviewRequest",
      onSelect: () => openDetails({ ...topRequest.appointment, patient: topRequest.patient }),
    }),
    accept: () => ({
      id: "accept",
      labelKey: "doctorPatientWorkspace.appointments.accept",
      onSelect: () => acceptAppointment(topRequest.appointment.id),
    }),
    proposeNewTime: () => ({
      id: "proposeNewTime",
      labelKey: "doctorAppointments.requests.propose",
      onSelect: () => openProposeFor({ ...topRequest.appointment, patient: topRequest.patient }),
    }),
    scheduleAppointment: () => ({
      id: "scheduleAppointment",
      labelKey: "doctorAppointments.newAppointment",
      onSelect: () => openComposer(null),
    }),
    viewToday: () => ({
      id: "viewToday",
      labelKey: "doctorAppointments.assistant.actions.viewToday",
      onSelect: () => {
        setCurrentDate(new Date());
        setSelectedDate(todayKey);
      },
    }),
    openNextPatient: () => ({
      id: "openNextPatient",
      labelKey: "doctorAssistantInsights.actions.openPatient",
      routeTo: `${ROUTES.DOCTOR_PATIENT_PROFILE.replace(":id", appointmentsInsight.nextPatientId)}?tab=appointments`,
    }),
  };
  const assistantActions = appointmentsInsight.actionIds.map((id) => ACTION_BUILDERS[id]());

  return (
    <DoctorLayout active="appointments">
      <div className="dc-page">
        <div className="dc-wrapper">
          <header className="dc-header">
            <div>
              <h1>{t("doctorAppointments.title")}</h1>
              <p>{t("doctorAppointments.subtitle")}</p>
            </div>
            <div className="dc-header-controls">
              <span className="dc-pill">{t("doctorAppointments.totalPill", { count: appointments.length })}</span>
              <button type="button" className="dc-primary-btn" onClick={() => openComposer(null)}>
                <LuPlus aria-hidden="true" /> {t("doctorAppointments.newAppointment")}
              </button>
            </div>
          </header>

          <AssistantInsightCard
            titleKey="doctorAssistantInsights.cardTitle"
            severity={appointmentsInsight.severity}
            lines={appointmentsInsight.lines}
            actions={assistantActions}
            className="dc-assistant-card"
          />

          <div className="dc-controls-row">
            <div className="dc-month-nav">
              <button type="button" className="dc-nav-btn" onClick={goToPrevMonth} aria-label={t("doctorAppointments.prevMonth")}>
                {i18n.dir() === "rtl" ? <LuChevronRight aria-hidden="true" /> : <LuChevronLeft aria-hidden="true" />}
              </button>
              <span className="dc-month-label" dir="auto">
                {monthLabel}
              </span>
              <button type="button" className="dc-nav-btn" onClick={goToNextMonth} aria-label={t("doctorAppointments.nextMonth")}>
                {i18n.dir() === "rtl" ? <LuChevronLeft aria-hidden="true" /> : <LuChevronRight aria-hidden="true" />}
              </button>
            </div>
            <div className="dc-view-toggle" role="group" aria-label={t("doctorAppointments.viewToggleLabel")}>
              <button type="button" className={viewMode === "month" ? "active" : ""} onClick={() => setViewMode("month")}>
                {t("doctorAppointments.viewMonth")}
              </button>
              <button type="button" className={viewMode === "agenda" ? "active" : ""} onClick={() => setViewMode("agenda")}>
                {t("doctorAppointments.viewAgenda")}
              </button>
            </div>
          </div>

          <div className="dc-main-layout">
            <div className="dc-calendar-card">
              {viewMode === "month" ? (
                <>
                  <div className="dc-weekdays-row">
                    {weekdayLabels.map((label) => (
                      <div key={label} className="dc-weekday">
                        {label}
                      </div>
                    ))}
                  </div>
                  <div className="dc-grid">
                    {monthGrid.map((cellDate) => {
                      const key = formatDateKey(cellDate);
                      const dayEvents = eventsByDateKey.get(key) || [];
                      const isMuted = cellDate.getMonth() !== currentDate.getMonth();
                      const isToday = key === todayKey;
                      const isSelected = key === selectedDate;
                      return (
                        <button
                          type="button"
                          key={key}
                          className={`dc-day-cell ${isMuted ? "dc-day-muted" : ""} ${isToday ? "dc-day-today" : ""} ${isSelected ? "dc-day-selected" : ""}`}
                          onClick={() => setSelectedDate(key)}
                          aria-current={isToday ? "date" : undefined}
                          aria-pressed={isSelected}
                        >
                          <span className="dc-day-number">{cellDate.getDate()}</span>
                          <span className="dc-events-mini">
                            {dayEvents.slice(0, 3).map((event) => (
                              <span key={event.id} className={`dc-event-chip dc-event-chip-${STATUS_TONE[event.status]}`}>
                                <span className="dc-event-dot" aria-hidden="true" />
                                <span className="dc-event-chip-time" dir="ltr">
                                  {timeFormatter.format(new Date(event.startAt))}
                                </span>
                                <span className="dc-event-chip-title" dir="auto">
                                  {event.patient?.name}
                                </span>
                              </span>
                            ))}
                            {dayEvents.length > 3 && <span className="dc-more-chip">{t("doctorAppointments.moreCount", { count: dayEvents.length - 3 })}</span>}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="dc-agenda">
                  {[
                    { key: "today", labelKey: "doctorAppointments.agenda.today", items: agendaGroups.today },
                    { key: "tomorrow", labelKey: "doctorAppointments.agenda.tomorrow", items: agendaGroups.tomorrow },
                    { key: "upcoming", labelKey: "doctorAppointments.agenda.upcoming", items: agendaGroups.upcoming },
                  ].map((group) =>
                    group.items.length === 0 ? null : (
                      <div key={group.key} className="dc-agenda-day">
                        <div className="dc-agenda-date">{t(group.labelKey)}</div>
                        {group.items.map((event) => (
                          <div
                            key={event.id}
                            className="dc-agenda-item"
                            onClick={() => openDetails(event)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                openDetails(event);
                              }
                            }}
                          >
                            <div className="dc-agenda-main">
                              <span className="dc-agenda-time" dir="ltr">
                                {dateTimeFormatter.format(new Date(event.startAt))}
                              </span>
                              <span className="dc-agenda-title" dir="auto">
                                {event.patient?.name} · {t(event.typeKey)}
                              </span>
                            </div>
                            <span className={`dc-chip dc-chip-${STATUS_TONE[event.status]}`}>{t(`doctorAppointments.status.${event.status}`)}</span>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                  {agendaGroups.today.length + agendaGroups.tomorrow.length + agendaGroups.upcoming.length === 0 && (
                    <p className="dc-empty">{t("doctorAppointments.agenda.empty")}</p>
                  )}
                </div>
              )}
            </div>

            <div className="dc-side-panel">
              {pendingRequests.length > 0 && (
                <div className="dc-side-card">
                  <div className="dc-side-header">
                    <h2>{t("doctorAppointments.requests.title")}</h2>
                    <span className="dc-side-date">{t("doctorAppointments.requests.count", { count: pendingRequests.length })}</span>
                  </div>
                  <div className="dc-side-events-list">
                    {pendingRequests.map(({ appointment, patient }) => (
                      <div key={appointment.id} className="dc-request-row">
                        <button type="button" className="dc-request-main" onClick={() => openDetails({ ...appointment, patient })}>
                          <span className="dc-side-event-title" dir="auto">
                            {patient?.name}
                          </span>
                          <span className="dc-side-event-time" dir="ltr">
                            {dateTimeFormatter.format(new Date(appointment.startAt))}
                          </span>
                        </button>
                        <div className="dc-request-actions">
                          <button type="button" className="dc-mini-btn dc-mini-btn--primary" onClick={() => acceptAppointment(appointment.id)}>
                            {t("doctorPatientWorkspace.appointments.accept")}
                          </button>
                          <button type="button" className="dc-mini-btn" onClick={() => openProposeFor({ ...appointment, patient })}>
                            {t("doctorAppointments.requests.propose")}
                          </button>
                          <button type="button" className="dc-mini-btn dc-mini-btn--danger" onClick={() => openDeclineFor({ ...appointment, patient })}>
                            {t("doctorAppointments.requests.decline")}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="dc-side-card">
                <div className="dc-side-header">
                  <h2>{t("doctorAppointments.selectedDay.title")}</h2>
                  <span className="dc-side-date" dir="auto">
                    {new Date(`${selectedDate}T00:00:00`).toLocaleDateString(i18n.language, { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                </div>
                {selectedDayAppointments.length === 0 ? (
                  <p className="dc-empty">{t("doctorAppointments.selectedDay.empty")}</p>
                ) : (
                  <div className="dc-side-events-list">
                    {selectedDayAppointments.map((event) => (
                      <div
                        key={event.id}
                        className="dc-side-event-row"
                        onClick={() => openDetails(event)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openDetails(event);
                          }
                        }}
                      >
                        <div>
                          <div className="dc-side-event-title" dir="auto">
                            {event.patient?.name}
                          </div>
                          <div className="dc-side-event-patient">{t(event.typeKey)}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span className="dc-side-event-time" dir="ltr">
                            {timeFormatter.format(new Date(event.startAt))}
                          </span>
                          <span className={`dc-chip dc-chip-${STATUS_TONE[event.status]}`}>{t(`doctorAppointments.status.${event.status}`)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button type="button" className="dc-secondary-btn" onClick={() => openComposer(null)}>
                  {t("doctorAppointments.selectedDay.addAppointment")}
                </button>
              </div>

              <div className="dc-side-card dc-side-summary">
                <h2>{t("doctorAppointments.summary.title", { month: monthLabel })}</h2>
                <ul className="dc-summary-list">
                  <li>
                    <span>{t("doctorAppointments.status.REQUESTED")}</span> <span>{monthSummary.requested}</span>
                  </li>
                  <li>
                    <span>{t("doctorAppointments.status.CONFIRMED")}</span> <span>{monthSummary.confirmed}</span>
                  </li>
                  <li>
                    <span>{t("doctorAppointments.status.ALTERNATIVE_PROPOSED")}</span> <span>{monthSummary.alternativeProposed}</span>
                  </li>
                  <li>
                    <span>{t("doctorAppointments.status.DECLINED")}</span> <span>{monthSummary.declined}</span>
                  </li>
                  <li>
                    <span>{t("doctorAppointments.status.CANCELLED")}</span> <span>{monthSummary.cancelled}</span>
                  </li>
                  <li>
                    <span>{t("doctorAppointments.status.COMPLETED")}</span> <span>{monthSummary.completed}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedAppointment && (
        <DoctorModal isOpen={!!selectedAppointment} onClose={closeDetails} title={t("doctorAppointments.details.title")} closeLabel={t("doctorPatientWorkspace.close")}>
          <div className="dc-details-header">
            <button type="button" className="dc-details-patient-link" onClick={() => navigate(`${ROUTES.DOCTOR_PATIENT_PROFILE.replace(":id", selectedAppointment.patientId)}?tab=appointments`)}>
              {selectedAppointment.patient?.name}
            </button>
            <span className={`dc-chip dc-chip-${STATUS_TONE[selectedAppointment.status]}`}>{t(`doctorAppointments.status.${selectedAppointment.status}`)}</span>
          </div>
          <p className="dc-details-source">
            {t(selectedAppointment.source === APPOINTMENT_SOURCE.DOCTOR ? "doctorAppointments.details.sourceDoctor" : "doctorAppointments.details.sourcePatient")}
          </p>

          <ul className="dc-details-list">
            <li>
              <span>{t("doctorAppointments.details.dateTime")}</span>
              <span dir="ltr">{dateTimeFormatter.format(new Date(selectedAppointment.startAt))}</span>
            </li>
            <li>
              <span>{t("doctorAppointments.details.type")}</span>
              <span>{t(selectedAppointment.typeKey)}</span>
            </li>
            <li>
              <span>{t("doctorAppointments.details.reason")}</span>
              <span>{t(`patientAppointments.reasons.${selectedAppointment.reasonCode}`)}</span>
            </li>
            <li>
              <span>{t("doctorAppointments.details.location")}</span>
              <span>{t(selectedAppointment.location.nameKey)}</span>
            </li>
          </ul>

          {selectedAppointment.note && (
            <div className="dc-modal-section">
              <h3>{t("doctorAppointments.details.note")}</h3>
              <p dir="auto">{selectedAppointment.note}</p>
            </div>
          )}

          {selectedAppointment.status === APPOINTMENT_STATUS.ALTERNATIVE_PROPOSED && selectedAppointment.clinicianResponse && (
            <div className="dc-modal-section">
              <h3>{t("doctorAppointments.details.yourProposal")}</h3>
              <p dir="ltr">{dateTimeFormatter.format(new Date(selectedAppointment.clinicianResponse.suggestedStartAt))}</p>
              <p className="dc-details-waiting">{t("doctorAppointments.details.awaitingPatient")}</p>
            </div>
          )}

          {selectedAppointment.status === APPOINTMENT_STATUS.DECLINED && selectedAppointment.clinicianResponse?.declineReasonCode && (
            <div className="dc-modal-section">
              <h3>{t("doctorAppointments.decline.reasonLabel")}</h3>
              <p>{t(`doctorAppointments.declineReasons.${selectedAppointment.clinicianResponse.declineReasonCode}`)}</p>
              {selectedAppointment.clinicianResponse.messageNote && <p dir="auto">{selectedAppointment.clinicianResponse.messageNote}</p>}
            </div>
          )}

          {selectedAppointment.status === APPOINTMENT_STATUS.REQUESTED && (
            <div className="dc-modal-footer">
              <button type="button" className="dc-ghost-btn" onClick={() => openDeclineFor(selectedAppointment)}>
                {t("doctorAppointments.requests.decline")}
              </button>
              <button type="button" className="dc-ghost-btn" onClick={() => openProposeFor(selectedAppointment)}>
                {t("doctorAppointments.requests.propose")}
              </button>
              <button
                type="button"
                className="dc-primary-btn"
                onClick={() => {
                  acceptAppointment(selectedAppointment.id);
                  closeDetails();
                }}
              >
                {t("doctorPatientWorkspace.appointments.accept")}
              </button>
            </div>
          )}

          {selectedAppointment.status === APPOINTMENT_STATUS.CONFIRMED && new Date(selectedAppointment.startAt) > new Date() && (
            <div className="dc-modal-footer">
              <button type="button" className="dc-ghost-btn" onClick={() => cancelAppointment(selectedAppointment.id)}>
                {t("doctorPatientWorkspace.appointments.cancel")}
              </button>
            </div>
          )}
        </DoctorModal>
      )}

      <DoctorAppointmentComposer
        isOpen={composerOpen}
        onClose={() => setComposerOpen(false)}
        patientId={composerPatientId}
        initialDate={selectedDate}
        onReviewExisting={(appointmentId) => setSelectedAppointmentId(appointmentId)}
      />
      <ProposeAlternativeModal isOpen={!!proposing} onClose={() => setProposing(null)} appointment={proposing} />
      <DeclineAppointmentModal isOpen={!!declining} onClose={() => setDeclining(null)} appointment={declining} />
    </DoctorLayout>
  );
};

export default DoctorCalendar;
