import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import "../styles/PatientAppointments.css";
import {
  getAllAppointments,
  getNextConfirmedAppointment,
  getRequestAppointments,
  getUpcomingAppointments,
  getPastAppointments,
  acceptAlternative,
} from "../appointments/patientAppointmentService";
import { getCareInsight } from "../appointments/patientAppointmentInsights";
import AppointmentHero from "../components/appointments/AppointmentHero";
import KneeGuideCareInsight from "../components/appointments/KneeGuideCareInsight";
import AppointmentList from "../components/appointments/AppointmentList";
import AppointmentDetailsModal from "../components/appointments/AppointmentDetailsModal";
import AppointmentRequestFlow from "../components/appointments/AppointmentRequestFlow";
import PatientButton from "../components/PatientButton";

/**
 * Patient Appointments — care coordination, not a generic calendar
 * (Section 7). Hierarchy: Next Appointment hero -> KneeGuide Care
 * Insight -> Request action -> Requests -> Upcoming -> Past. This page's
 * own job is orchestration: reading the merged appointment list from
 * appointments/patientAppointmentService.js (the SAME module the
 * KneeGuide Assistant's REQUEST_APPOINTMENT action uses — see
 * patientAssistantActions.js), owning which modal is open, and wiring
 * list/detail/request components together. No scheduling/conflict logic
 * lives directly in this component.
 *
 * `refreshKey` forces `getAllAppointments()` to be re-read after any
 * mutation (submit / accept / reschedule) — those functions write
 * straight to localStorage (appointments/patientAppointmentStorage.js)
 * and return the updated record, but this page still needs to
 * re-derive its OWN lists/insight from the full merged set afterward.
 */
const PatientAppointments = () => {
  const { t } = useTranslation();

  // Only the setter is used — bumping this forces a re-render (which is
  // all `refresh()` needs) after a mutation writes to localStorage; the
  // value itself is never read.
  const [, setRefreshKey] = useState(0);
  const [detailsAppointment, setDetailsAppointment] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [requestFlow, setRequestFlow] = useState({ open: false, mode: "new", rescheduleAppointmentId: null, initialReasonCode: null, initialNote: "" });

  const referenceDate = useMemo(() => new Date(), []);

  // Deliberately NOT memoized on `refreshKey` — these are cheap
  // synchronous reads/filters over a handful of appointments, so there's
  // no real cost to recomputing them every render, and it sidesteps the
  // awkward "bump a counter just to force useMemo to re-run" pattern
  // entirely. `refreshKey` itself only exists to trigger a re-render
  // after a mutation (see `refresh` below); React re-running this
  // function body on that re-render is all that's actually needed.
  const appointments = getAllAppointments(referenceDate);
  const nextAppointment = getNextConfirmedAppointment(referenceDate);
  const requestAppointments = getRequestAppointments(referenceDate);
  const upcomingAppointments = getUpcomingAppointments(referenceDate);
  const pastAppointments = getPastAppointments(referenceDate);

  const careInsight = getCareInsight(appointments, referenceDate);

  const refresh = () => setRefreshKey((value) => value + 1);

  const openDetails = (appointment) => {
    setDetailsAppointment(appointment);
    setDetailsOpen(true);
  };

  const openNewRequest = () => {
    setRequestFlow({ open: true, mode: "new", rescheduleAppointmentId: null, initialReasonCode: null, initialNote: "" });
  };

  const openRescheduleFlow = (appointment) => {
    setDetailsOpen(false);
    setRequestFlow({
      open: true,
      mode: "reschedule",
      rescheduleAppointmentId: appointment.id,
      initialReasonCode: appointment.reasonCode,
      initialNote: appointment.note || "",
    });
  };

  const handleAcceptAlternative = (appointmentId) => {
    const result = acceptAlternative(appointmentId);
    if (result.ok) {
      refresh();
      setDetailsAppointment(result.appointment);
    }
  };

  const handleViewInsightAppointment = (appointmentId) => {
    const appointment = appointments.find((item) => item.id === appointmentId);
    if (appointment) openDetails(appointment);
  };

  return (
    <div className="pa-page">
      <div className="pa-inner">
        <header className="pa-header">
          <h1>{t("patientAppointments.header.title")}</h1>
          <p>{t("patientAppointments.header.subtitle")}</p>
        </header>

        <AppointmentHero appointment={nextAppointment} onViewDetails={openDetails} onRequestClick={openNewRequest} now={referenceDate} />

        <KneeGuideCareInsight insight={careInsight} onRequestClick={openNewRequest} onViewAppointment={handleViewInsightAppointment} />

        <div className="pa-request-cta">
          <PatientButton type="button" variant="primary" onClick={openNewRequest}>
            {t("patientAppointments.request.cta")}
          </PatientButton>
        </div>

        <AppointmentList
          title={t("patientAppointments.sections.requests")}
          appointments={requestAppointments}
          emptyMessage={t("patientAppointments.sections.requestsEmpty")}
          onViewDetails={openDetails}
        />

        <AppointmentList
          title={t("patientAppointments.sections.upcoming")}
          appointments={upcomingAppointments}
          emptyMessage={t("patientAppointments.sections.upcomingEmpty")}
          onViewDetails={openDetails}
        />

        <AppointmentList
          title={t("patientAppointments.sections.past")}
          appointments={pastAppointments}
          emptyMessage={t("patientAppointments.sections.pastEmpty")}
          onViewDetails={openDetails}
        />
      </div>

      <AppointmentDetailsModal
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        appointment={detailsAppointment}
        onAcceptAlternative={handleAcceptAlternative}
        onChooseAnotherTime={openRescheduleFlow}
      />

      <AppointmentRequestFlow
        isOpen={requestFlow.open}
        onClose={() => setRequestFlow((prev) => ({ ...prev, open: false }))}
        mode={requestFlow.mode}
        rescheduleAppointmentId={requestFlow.rescheduleAppointmentId}
        initialReasonCode={requestFlow.initialReasonCode}
        initialNote={requestFlow.initialNote}
        onSubmitted={refresh}
      />
    </div>
  );
};

export default PatientAppointments;
