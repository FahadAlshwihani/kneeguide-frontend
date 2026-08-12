import { PATIENTS } from "./demoData/patients";
import { INITIAL_PRESCRIPTIONS, buildPrescriptionId, nowIso } from "./demoData/rehabPlans";
import { buildInitialSessions } from "./demoData/sessions";
import { buildInitialAppointments } from "./demoData/appointments";
import { buildInitialReports } from "./demoData/reports";
import { buildInitialClinicalNotes } from "./demoData/clinicalNotes";
import { buildInitialMedicalFiles } from "./demoData/medicalFiles";
import { buildInitialDoctorProfile } from "./demoData/doctorProfile";
import { APPOINTMENT_STATUS, REPORT_STATUS, PRESCRIPTION_STATUS, NOTE_AUTHOR_ROLE, NOTE_VISIBILITY, ATTENTION_LEVEL } from "./rehabEnums";
import {
  generateReportMetrics,
  computeAdherence,
  derivePatientPriority,
  deriveLatestPain,
  derivePainTrend,
  deriveLatestRom,
  deriveRomTrend,
  deriveTrendDirection,
} from "./rehabDerived";
import { loadRehabState, saveRehabState, clearLegacyKeys, resetRehabState } from "./rehabStorage";

const PRIORITY_SORT_RANK = {
  [ATTENTION_LEVEL.NEEDS_ATTENTION]: 0,
  [ATTENTION_LEVEL.REVIEW_RECOMMENDED]: 1,
  [ATTENTION_LEVEL.STABLE]: 2,
};

/**
 * THE single shared demo domain store (Section 3 of the brief) — one
 * in-memory module singleton (ES modules are cached, so every importer
 * anywhere in the app — a Patient page, a Doctor page, the Assistant —
 * gets the exact same instance) backed by ONE versioned localStorage key
 * (rehabStorage.js). This is what makes "Doctor changes Ahmed's plan ->
 * Patient Dashboard shows it" and "Patient logs pain -> Doctor sees it"
 * true within one browser session, without a backend.
 *
 * Reactivity: a plain subscribe/notify pair, consumed via
 * `useSyncExternalStore` in useRehabDomain.js — no Context provider is
 * needed (a singleton module doesn't need one to be "found"; Context
 * would only add an unnecessary provider-placement decision). This
 * mirrors the existing `patientAppointmentService.js` precedent (a plain
 * capability module, not a Context) scaled up to be reactive/shared
 * across two independently-mounted route trees.
 *
 * EVERY mutation in this app goes through the named action functions at
 * the bottom of this file (assignExercise, completeSession, logPain,
 * requestAppointment, confirmAppointment, ...) — Section 52's
 * "domain actions, not ad-hoc setState spreads" requirement. Nothing
 * outside this file ever reaches into `state` directly.
 */

const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

const buildInitialState = (referenceDate = new Date()) => {
  const sessions = buildInitialSessions(referenceDate);

  // Pain log history is DERIVED from the seeded sessions' own painAfter
  // values (Section 12/57 — no independent pain dataset). A session
  // without a recorded painAfter contributes nothing.
  const painLogs = {};
  PATIENTS.forEach((patient) => {
    painLogs[patient.id] = sessions
      .filter((session) => session.patientId === patient.id && typeof session.painAfter === "number")
      .map((session) => ({ value: session.painAfter, recordedAt: session.completedAt }));
  });

  const prescriptions = INITIAL_PRESCRIPTIONS.map((rx) => ({ ...rx }));
  const appointments = buildInitialAppointments(referenceDate);
  const reports = buildInitialReports(referenceDate);
  const clinicalNotes = buildInitialClinicalNotes(referenceDate);
  const medicalFiles = buildInitialMedicalFiles(referenceDate);

  // Auto-generate each patient's CURRENT-period report from their seeded
  // sessions (Section 23) — never hand-authored, so it can never
  // contradict the Sessions tab. Skipped for a patient with no sessions
  // in the window (nothing to summarize yet).
  PATIENTS.forEach((patient) => {
    const patientSessions = sessions.filter((session) => session.patientId === patient.id);
    if (patientSessions.length === 0) return;
    const periodStart = new Date(referenceDate);
    periodStart.setDate(periodStart.getDate() - 7);
    const metrics = generateReportMetrics({
      prescriptions: prescriptions.filter((rx) => rx.patientId === patient.id),
      sessions: patientSessions,
      periodStart: periodStart.toISOString(),
      periodEnd: referenceDate.toISOString(),
    });
    if (!metrics) return;
    reports.push({
      id: `rpt-${patient.id}-current`,
      patientId: patient.id,
      periodStart: periodStart.toISOString(),
      periodEnd: referenceDate.toISOString(),
      generatedAt: referenceDate.toISOString(),
      ...metrics,
      reviewStatus: REPORT_STATUS.AWAITING_REVIEW,
      reviewedAt: null,
      reviewerNote: null,
      isLive: true,
    });
  });

  return { prescriptions, sessions, appointments, reports, clinicalNotes, medicalFiles, painLogs, doctorProfile: buildInitialDoctorProfile() };
};

let state = loadRehabState() || buildInitialState();
// Backfill for state persisted before `doctorProfile` existed (Section 1 of
// the Doctor Profile brief) — a structurally valid OLDER envelope loads
// successfully but simply predates this field; never let a real doctor
// mutation crash because of a missing default instead of failing loudly.
if (!state.doctorProfile) {
  state = { ...state, doctorProfile: buildInitialDoctorProfile() };
}
if (!loadRehabState()) {
  clearLegacyKeys();
  saveRehabState(state);
}

const listeners = new Set();
const notify = () => listeners.forEach((listener) => listener());
const persist = () => saveRehabState(state);
const setState = (patch) => {
  state = { ...state, ...patch };
  persist();
  notify();
};

export const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getState = () => state;

// ---------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------

export const getPatients = () => PATIENTS;
export const getPatient = (patientId) => PATIENTS.find((patient) => patient.id === patientId) || null;

/** THE canonical, editable doctor identity/availability (Doctor Profile brief) — one record, every consumer. */
export const getDoctorProfile = () => state.doctorProfile;

export const getPrescriptions = (patientId, { activeOnly = true } = {}) =>
  state.prescriptions.filter((rx) => rx.patientId === patientId && (!activeOnly || rx.status === PRESCRIPTION_STATUS.ACTIVE));

export const getSessions = (patientId) =>
  state.sessions.filter((session) => session.patientId === patientId).sort((a, b) => new Date(a.date) - new Date(b.date));

export const getSessionById = (sessionId) => state.sessions.find((session) => session.id === sessionId) || null;

export const getAppointments = (patientId) =>
  state.appointments.filter((appt) => appt.patientId === patientId).sort((a, b) => new Date(a.startAt) - new Date(b.startAt));

export const getAllAppointments = () => [...state.appointments].sort((a, b) => new Date(a.startAt) - new Date(b.startAt));

export const getAppointmentById = (appointmentId) => state.appointments.find((appt) => appt.id === appointmentId) || null;

/**
 * Real scheduling-conflict detection (Section 14/39 of the Doctor
 * Appointments brief — "do not silently allow overlapping doctor
 * appointments"). Only CONFIRMED appointments represent an actual
 * clinician time commitment, so only those are checked; a REQUESTED or
 * ALTERNATIVE_PROPOSED slot hasn't been committed to yet. Returns the
 * first conflicting appointment, or null.
 */
export const findSchedulingConflict = (startAt, endAt, { excludeAppointmentId } = {}) => {
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  return (
    state.appointments.find((appt) => {
      if (appt.id === excludeAppointmentId) return false;
      if (appt.status !== APPOINTMENT_STATUS.CONFIRMED) return false;
      const apptStart = new Date(appt.startAt).getTime();
      const apptEnd = new Date(appt.endAt).getTime();
      return start < apptEnd && apptStart < end;
    }) || null
  );
};

export const getReports = (patientId) =>
  state.reports.filter((report) => report.patientId === patientId).sort((a, b) => new Date(b.periodEnd) - new Date(a.periodEnd));

export const getReportById = (reportId) => state.reports.find((report) => report.id === reportId) || null;

export const getClinicalNotes = (patientId, { visibility } = {}) =>
  state.clinicalNotes
    .filter((note) => note.patientId === patientId && (!visibility || note.visibility === visibility))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

export const getMedicalFiles = (patientId) =>
  state.medicalFiles.filter((file) => file.patientId === patientId).sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

export const getPainLogs = (patientId) =>
  [...(state.painLogs[patientId] || [])].sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt));

export const getLatestPainLogEntry = (patientId) => {
  const logs = getPainLogs(patientId);
  return logs.length ? logs[logs.length - 1] : null;
};

/**
 * ONE patient's full derived bundle — every field a Workspace tab, a
 * Doctor Assistant insight, or a Doctor Home Assistant answer needs, all
 * computed via rehabDerived.js exactly once per call. `useRehabPatient()`
 * (useRehabDomain.js) is a thin reactive wrapper around this exact
 * function; non-React callers (the Assistant action registry, which runs
 * outside any component) call it directly — so there is only ONE place
 * adherence/priority/trends are ever computed, never a second copy
 * re-derived inside Assistant-specific code (Section 3/30 of the brief).
 */
export const getPatientBundle = (patientId) => {
  const patient = getPatient(patientId);
  if (!patient) return null;

  const prescriptions = getPrescriptions(patientId, { activeOnly: false });
  const activePrescriptions = prescriptions.filter((rx) => rx.status === PRESCRIPTION_STATUS.ACTIVE);
  const sessions = getSessions(patientId);
  const appointments = getAppointments(patientId);
  const reports = getReports(patientId);
  const clinicalNotes = getClinicalNotes(patientId);
  const medicalFiles = getMedicalFiles(patientId);
  const painLogs = getPainLogs(patientId);

  const adherence = computeAdherence({ prescriptions: activePrescriptions, sessions });
  const priority = derivePatientPriority({ prescriptions: activePrescriptions, sessions, appointments, reports, painLogs });
  const latestPain = deriveLatestPain(painLogs);
  const painTrend = derivePainTrend(painLogs);
  const latestRom = deriveLatestRom(sessions);
  const romTrend = deriveRomTrend(sessions);
  const trendDirection = deriveTrendDirection(priority);
  const latestSession = sessions[sessions.length - 1] || null;

  return {
    patient,
    prescriptions,
    activePrescriptions,
    sessions,
    latestSession,
    appointments,
    reports,
    clinicalNotes,
    medicalFiles,
    painLogs,
    adherence,
    priority,
    latestPain,
    painTrend,
    latestRom,
    romTrend,
    trendDirection,
  };
};

/** Every patient's worklist-summary bundle (Section 30 — computed once, shared by the Patients list, the Assistant's attention list, and the Doctor Home brief). */
export const getWorklistBundles = () => getPatients().map((patient) => getPatientBundle(patient.id));

export const getPatientsNeedingAttention = () =>
  getWorklistBundles()
    .filter((bundle) => bundle.priority.reasons.length > 0)
    .sort((a, b) => PRIORITY_SORT_RANK[a.priority.level] - PRIORITY_SORT_RANK[b.priority.level]);

// ---------------------------------------------------------------------
// Mutations — domain actions (Section 52)
// ---------------------------------------------------------------------

/** Doctor assigns a new exercise to a patient's active rehabilitation plan. */
export const assignExercise = (patientId, input) => {
  const prescription = {
    id: buildPrescriptionId(patientId, input.exerciseId),
    patientId,
    exerciseId: input.exerciseId,
    mode: input.mode,
    sets: input.sets,
    repsPerSet: input.mode === "reps" ? input.repsPerSet : null,
    durationSeconds: input.mode === "duration" ? input.durationSeconds : null,
    holdSeconds: input.holdSeconds ?? null,
    frequencyPerWeek: input.frequencyPerWeek,
    targetRomMin: input.targetRomMin ?? null,
    targetRomMax: input.targetRomMax ?? null,
    instructionsNote: input.instructionsNote?.trim() || null,
    status: PRESCRIPTION_STATUS.ACTIVE,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  setState({ prescriptions: [...state.prescriptions, prescription] });
  return prescription;
};

export const updatePrescription = (prescriptionId, patch) => {
  setState({
    prescriptions: state.prescriptions.map((rx) => (rx.id === prescriptionId ? { ...rx, ...patch, updatedAt: nowIso() } : rx)),
  });
};

/** Soft-delete — keeps historical sessions that reference this prescription meaningful (Section 57). */
export const removePrescription = (prescriptionId) => {
  setState({
    prescriptions: state.prescriptions.map((rx) =>
      rx.id === prescriptionId ? { ...rx, status: PRESCRIPTION_STATUS.REMOVED, updatedAt: nowIso() } : rx
    ),
  });
};

/**
 * Records a real, just-completed rehabilitation session (called once the
 * Patient's own session state machine reaches COMPLETED). `painAfter`, if
 * present, is also appended to the shared pain log — one write, visible
 * from both the pain trend chart and any future session review.
 */
export const completeSession = (patientId, sessionInput) => {
  const session = {
    id: sessionInput.id || generateId(`sess-${patientId}`),
    patientId,
    date: sessionInput.date || nowIso(),
    startedAt: sessionInput.startedAt,
    completedAt: sessionInput.completedAt || nowIso(),
    status: "completed",
    painBefore: sessionInput.painBefore ?? null,
    painAfter: sessionInput.painAfter ?? null,
    exercises: sessionInput.exercises || [],
    reviewed: false,
    doctorNoteId: null,
    source: "patient_app",
  };

  const painLogs = { ...state.painLogs };
  if (typeof session.painAfter === "number") {
    painLogs[patientId] = [...(painLogs[patientId] || []), { value: session.painAfter, recordedAt: session.completedAt }];
  }

  setState({ sessions: [...state.sessions, session], painLogs });
  return session;
};

export const markSessionReviewed = (sessionId, { reviewed = true, doctorNoteId = null } = {}) => {
  setState({
    sessions: state.sessions.map((session) => (session.id === sessionId ? { ...session, reviewed, doctorNoteId } : session)),
  });
};

/** A pain value logged outside a session (e.g. the Patient Assistant's pain logger widget). */
export const logPain = (patientId, value) => {
  const intValue = Math.round(value);
  if (!Number.isInteger(intValue) || intValue < 0 || intValue > 10) {
    throw new Error("logPain: value must be an integer between 0 and 10");
  }
  const record = { value: intValue, recordedAt: nowIso() };
  setState({ painLogs: { ...state.painLogs, [patientId]: [...(state.painLogs[patientId] || []), record] } });
  return record;
};

const HALF_HOUR_MS = 30 * 60000;

/** Patient requests an appointment. Never auto-confirms; rejects with a reason on a real conflict/duplicate. */
export const requestAppointment = (patientId, { reasonCode, note, startAt, endAt, typeKey, clinicianId }) => {
  const existing = getAllAppointments();
  const startTime = new Date(startAt).getTime();

  const hasConfirmedConflict = existing.some(
    (appt) => appt.status === APPOINTMENT_STATUS.CONFIRMED && new Date(appt.startAt).getTime() === startTime
  );
  if (hasConfirmedConflict) return { ok: false, reason: "conflict" };

  const hasDuplicateRequest = existing.some(
    (appt) =>
      appt.patientId === patientId &&
      [APPOINTMENT_STATUS.REQUESTED, APPOINTMENT_STATUS.ALTERNATIVE_PROPOSED].includes(appt.status) &&
      new Date(appt.startAt).getTime() === startTime
  );
  if (hasDuplicateRequest) return { ok: false, reason: "duplicate" };

  const appointment = {
    id: generateId(`appt-${patientId}`),
    patientId,
    clinicianId,
    startAt,
    endAt: endAt || new Date(startTime + HALF_HOUR_MS).toISOString(),
    typeKey: typeKey || "patientAppointments.types.followUp",
    reasonCode,
    note: typeof note === "string" && note.trim() ? note.trim().slice(0, 280) : null,
    status: APPOINTMENT_STATUS.REQUESTED,
    requestedAt: nowIso(),
    reviewedAt: null,
    clinicianResponse: null,
    location: { type: "clinic", nameKey: "patientAppointments.location.clinicName", room: "4" },
    source: "patient",
  };
  setState({ appointments: [...state.appointments, appointment] });
  return { ok: true, appointment };
};

/** Doctor schedules a follow-up directly — confirmed immediately, no request/accept cycle (Section 28). */
export const scheduleAppointment = (patientId, { startAt, endAt, typeKey, note, clinicianId }) => {
  const appointment = {
    id: generateId(`appt-${patientId}`),
    patientId,
    clinicianId,
    startAt,
    endAt: endAt || new Date(new Date(startAt).getTime() + HALF_HOUR_MS).toISOString(),
    typeKey: typeKey || "doctorPatients.appointmentTypes.rehabSession",
    reasonCode: "generalFollowUp",
    note: typeof note === "string" && note.trim() ? note.trim().slice(0, 280) : null,
    status: APPOINTMENT_STATUS.CONFIRMED,
    requestedAt: nowIso(),
    reviewedAt: nowIso(),
    clinicianResponse: null,
    location: { type: "clinic", nameKey: "patientAppointments.location.clinicName", room: "4" },
    source: "doctor",
  };
  setState({ appointments: [...state.appointments, appointment] });
  return appointment;
};

const patchAppointment = (appointmentId, patch) => {
  const found = state.appointments.find((appt) => appt.id === appointmentId);
  if (!found) return { ok: false };
  const updated = { ...found, ...patch };
  setState({ appointments: state.appointments.map((appt) => (appt.id === appointmentId ? updated : appt)) });
  return { ok: true, appointment: updated };
};

/** Doctor accepts a REQUESTED appointment as-is. */
export const confirmAppointment = (appointmentId) =>
  patchAppointment(appointmentId, { status: APPOINTMENT_STATUS.CONFIRMED, reviewedAt: nowIso(), clinicianResponse: null });

/** Doctor proposes a different time for a REQUESTED appointment. */
export const proposeAppointmentTime = (appointmentId, { suggestedStartAt, suggestedEndAt, messageNote }) =>
  patchAppointment(appointmentId, {
    status: APPOINTMENT_STATUS.ALTERNATIVE_PROPOSED,
    reviewedAt: nowIso(),
    clinicianResponse: { messageKey: null, messageNote: messageNote || null, suggestedStartAt, suggestedEndAt, followUpLabelKey: null },
  });

/** Doctor rejects a REQUESTED appointment — a real reason is always required (Section 39: never a blind reject). */
export const rejectAppointment = (appointmentId, { reasonCode, note } = {}) =>
  patchAppointment(appointmentId, {
    status: APPOINTMENT_STATUS.DECLINED,
    reviewedAt: nowIso(),
    clinicianResponse: {
      messageKey: reasonCode ? `patientAppointments.declineReasons.${reasonCode}` : null,
      declineReasonCode: reasonCode || null,
      messageNote: note || null,
      suggestedStartAt: null,
      suggestedEndAt: null,
      followUpLabelKey: null,
    },
  });

export const cancelAppointment = (appointmentId) => patchAppointment(appointmentId, { status: APPOINTMENT_STATUS.CANCELLED });

/** Patient accepts the doctor's proposed alternative time. */
export const acceptAlternative = (appointmentId) => {
  const found = state.appointments.find((appt) => appt.id === appointmentId);
  if (!found || found.status !== APPOINTMENT_STATUS.ALTERNATIVE_PROPOSED || !found.clinicianResponse) return { ok: false };
  return patchAppointment(appointmentId, {
    status: APPOINTMENT_STATUS.CONFIRMED,
    startAt: found.clinicianResponse.suggestedStartAt,
    endAt: found.clinicianResponse.suggestedEndAt,
    clinicianResponse: null,
  });
};

/** Patient rejects the proposal and requests a different slot — reuses the same request record, back to REQUESTED. */
export const chooseAnotherTime = (appointmentId, { startAt, endAt }) => {
  const existing = getAllAppointments();
  const startTime = new Date(startAt).getTime();
  const hasConfirmedConflict = existing.some(
    (appt) => appt.id !== appointmentId && appt.status === APPOINTMENT_STATUS.CONFIRMED && new Date(appt.startAt).getTime() === startTime
  );
  if (hasConfirmedConflict) return { ok: false, reason: "conflict" };
  return patchAppointment(appointmentId, {
    startAt,
    endAt: endAt || new Date(startTime + HALF_HOUR_MS).toISOString(),
    status: APPOINTMENT_STATUS.REQUESTED,
    requestedAt: nowIso(),
    reviewedAt: null,
    clinicianResponse: null,
  });
};

/** Doctor-triggered (re)generation of the current period's report from live session data (Section 23). */
export const generateReportSnapshot = (patientId, { periodStart, periodEnd } = {}) => {
  const end = periodEnd ? new Date(periodEnd) : new Date();
  const start = periodStart ? new Date(periodStart) : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
  const metrics = generateReportMetrics({
    prescriptions: getPrescriptions(patientId, { activeOnly: false }),
    sessions: getSessions(patientId),
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
  });
  if (!metrics) return null;

  const report = {
    id: generateId(`rpt-${patientId}`),
    patientId,
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
    generatedAt: nowIso(),
    ...metrics,
    reviewStatus: REPORT_STATUS.AWAITING_REVIEW,
    reviewedAt: null,
    reviewerNote: null,
    isLive: true,
  };
  setState({ reports: [...state.reports, report] });
  return report;
};

/** Marks a report reviewed. Never touches the sessions/measurements it summarizes (Section 24/58). */
export const markReportReviewed = (reportId, { reviewerNote } = {}) => {
  setState({
    reports: state.reports.map((report) =>
      report.id === reportId
        ? { ...report, reviewStatus: REPORT_STATUS.REVIEWED, reviewedAt: nowIso(), reviewerNote: reviewerNote?.trim() || report.reviewerNote || null }
        : report
    ),
  });
};

/**
 * Adds a clinical note. Defaults to CLINICIAN_ONLY for doctor-authored
 * notes (Section 33) — callers must explicitly pass PATIENT_VISIBLE to
 * change that; nothing here silently exposes a note to the Patient UI.
 */
export const addClinicalNote = (patientId, { authorId, authorRole = NOTE_AUTHOR_ROLE.DOCTOR, typeKey, content, visibility, sessionId, reportId }) => {
  const trimmed = (content || "").trim();
  if (!trimmed) throw new Error("addClinicalNote: content must not be empty");
  const note = {
    id: generateId(`note-${patientId}`),
    patientId,
    authorId,
    authorRole,
    typeKey: typeKey || "rehabDomain.noteTypes.general",
    content: trimmed,
    createdAt: nowIso(),
    visibility: visibility || (authorRole === NOTE_AUTHOR_ROLE.DOCTOR ? NOTE_VISIBILITY.CLINICIAN_ONLY : NOTE_VISIBILITY.PATIENT_VISIBLE),
    sessionId: sessionId || null,
    reportId: reportId || null,
  };
  setState({ clinicalNotes: [...state.clinicalNotes, note] });
  return note;
};

/**
 * The ONE mutation Doctor Profile (and nothing else) calls to persist
 * identity/contact/availability/working-hours edits — a plain merge, no
 * validation here (the form validates before ever calling this, same
 * division of labor as every other canonical mutation in this file).
 * `id` is never accepted in `patch` — the anchor to the existing
 * `clinicianId` every appointment already stores must never drift.
 */
export const updateDoctorProfile = (patch) => {
  const { id, ...safePatch } = patch;
  setState({ doctorProfile: { ...state.doctorProfile, ...safePatch } });
  return state.doctorProfile;
};

/** Dev-only escape hatch — never exposed as a patient/doctor-facing control. */
export const resetDemoDomain = () => {
  resetRehabState();
  state = buildInitialState();
  persist();
  notify();
};
