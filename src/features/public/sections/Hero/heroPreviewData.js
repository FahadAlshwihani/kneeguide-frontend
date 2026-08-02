/**
 * Static, clearly-fictional preview data for the Hero's dashboard-card
 * composition. No API calls, no real patient data — just enough to make
 * the shared cards look like a real product. Values are fixed (not
 * randomized) so the Hero renders identically on every load.
 *
 * `t` is the react-i18next translate function, passed in by the caller so
 * this stays a plain data module rather than a hook.
 */
export const getHeroPreviewData = (t) => {
  const p = (key, options) => t(`publicHero.preview.${key}`, options);

  return {
    doctor: {
      badge: p("doctorBadge"),
      metric: {
        value: 42,
        label: p("activePatientsLabel"),
      },
      todayAppointments: {
        value: 7,
        label: p("todayAppointmentsLabel"),
      },
      newReports: {
        value: 4,
        label: p("newReportsLabel"),
      },
      appointment: {
        title: p("upcomingAppointmentTitle"),
        dateDay: p("appointmentDateDay"),
        dateMonth: p("appointmentDateMonth"),
        time: p("appointmentTime"),
        type: p("appointmentType"),
        withLabel: p("withPatientPrefix"),
        withName: "Ahmed Ali",
        primaryActionLabel: p("reschedule"),
        secondaryActionLabel: p("viewAll"),
      },
      progress: {
        label: p("progressLabel"),
        sub: p("progressSub"),
        value: "78%",
        progress: 78,
      },
      alert: {
        label: p("alertLabel"),
        sub: p("alertSub"),
      },
      messages: {
        value: 3,
        label: p("messagesLabel"),
        sub: p("messagesSub"),
      },
      notes: {
        value: 5,
        label: p("notesLabel"),
        sub: p("notesSub"),
      },
    },
    patient: {
      badge: p("patientBadge"),
      exercisesAssigned: {
        value: 3,
        label: p("exercisesAssignedLabel"),
      },
      sessionCompletion: {
        value: "84%",
        label: p("sessionCompletionLabel"),
        sub: p("sessionCompletionSub"),
      },
      avgExerciseTime: {
        value: "28m",
        label: p("avgExerciseTimeLabel"),
        sub: p("avgExerciseTimeSub"),
      },
      romImprovement: {
        value: "+12%",
        label: p("romImprovementLabel"),
        sub: p("romImprovementSub"),
      },
      exercise: {
        name: p("exerciseName"),
        reps: p("exerciseReps"),
        lastDoneLabel: p("lastDoneLabel"),
        lastDone: p("exerciseLastDone"),
        progress: 60,
        startLabel: p("start"),
      },
      rom: {
        label: p("romLabel"),
        sub: p("romSub"),
        value: p("romValue"),
        progress: 82,
      },
      adherence: {
        label: p("adherenceLabel"),
        sub: p("adherenceSub"),
        value: p("adherenceValue"),
        progress: 76,
      },
      appointment: {
        title: p("upcomingAppointmentTitle"),
        dateDay: p("appointmentDateDay"),
        dateMonth: p("appointmentDateMonth"),
        time: p("appointmentTime"),
        type: p("appointmentType"),
        withLabel: p("withDoctorPrefix"),
        withName: "Sarah Ahmed",
        primaryActionLabel: p("reschedule"),
        secondaryActionLabel: p("viewAll"),
      },
    },
  };
};
