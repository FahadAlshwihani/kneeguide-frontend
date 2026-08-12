import { getExerciseById } from "./patientExercisesData";
import { DEFAULT_CLINICIAN } from "./patientClinicianData";
import { rehabRepository } from "../../../../domain/rehab/useRehabDomain";
import { PATIENT_PROFILE_PATIENT_ID } from "../../../../domain/rehab/demoData/patients";
import { sessionAverageRom } from "../../../../domain/rehab/rehabDerived";

/**
 * Patient Recovery Reports, now mapped directly from the shared rehab
 * domain's canonical SESSION history (src/domain/rehab/) instead of a
 * private fixture array — this is what makes a session the Doctor can
 * see on the Sessions tab the SAME session the patient sees here
 * (Section 20's "session" concept and this page's "report" concept are
 * now one underlying record, just two different views of it).
 *
 * `getAllReports()` keeps its pre-refactor name/shape/signature (every
 * consumer — Reports.jsx, patientReportMetrics.js, patientReportInsights.js
 * — is unchanged) but no longer needs a separate "merge today's live
 * session on top of fixtures" step: once a real session completes,
 * PatientExercises.jsx calls `rehabRepository.completeSession(...)`,
 * which lands it in the SAME canonical list this function reads — so a
 * just-finished session appears here automatically, no special-casing.
 */

export const REVIEW_STATUS = {
  REVIEWED: "reviewed",
  AWAITING_REVIEW: "awaiting_review",
  NOT_SHARED: "not_shared",
};

const QUALITY_RANK = { fair: 0, good: 1, excellent: 2 };
const QUALITY_BY_RANK = ["fair", "good", "excellent"];

const sessionAverageQuality = (exercises) => {
  const ranks = exercises.map((exercise) => QUALITY_RANK[exercise.qualityKey] ?? 1);
  if (ranks.length === 0) return "good";
  const avg = Math.round(ranks.reduce((sum, value) => sum + value, 0) / ranks.length);
  return QUALITY_BY_RANK[Math.min(2, Math.max(0, avg))];
};

const toDayId = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const mapSessionToReport = (session, todayId) => {
  const completion = {
    exercisesCompleted: session.exercises.filter((exercise) => exercise.completedSets >= exercise.totalSets).length,
    exercisesTotal: session.exercises.length,
    setsCompleted: session.exercises.reduce((sum, exercise) => sum + exercise.completedSets, 0),
    setsTotal: session.exercises.reduce((sum, exercise) => sum + exercise.totalSets, 0),
  };

  const duration =
    session.completedAt && session.startedAt ? Date.parse(session.completedAt) - Date.parse(session.startedAt) : null;

  return {
    id: session.id,
    date: new Date(session.date),
    sessionStatus: session.status,
    duration,
    pain: { before: session.painBefore, after: session.painAfter },
    rom: { flexion: sessionAverageRom(session), extension: null },
    movementQuality: session.exercises.length ? sessionAverageQuality(session.exercises) : null,
    completion,
    exercises: session.exercises.map((exercise) => ({
      id: exercise.id,
      nameKey: getExerciseById(exercise.id)?.nameKey || exercise.id,
      completedSets: exercise.completedSets,
      totalSets: exercise.totalSets,
      rom: exercise.rom,
      qualityKey: exercise.qualityKey,
      durationMs: exercise.durationMs,
    })),
    clinicalReview: {
      status: session.reviewed ? REVIEW_STATUS.REVIEWED : REVIEW_STATUS.AWAITING_REVIEW,
      doctorName: session.reviewed ? DEFAULT_CLINICIAN.name : null,
      reviewedAt: null,
      messageKey: null,
      followUpRecommended: false,
    },
    isDetailed: true,
    isLiveToday: todayId ? toDayId(session.date) === todayId && session.source === "patient_app" : false,
  };
};

/**
 * The full report list — every canonical completed session for the
 * logged-in demo patient, chronologically oldest-first (unchanged
 * ordering contract; callers needing "newest first" sort their own copy).
 */
export const getAllReports = (referenceDate = new Date(), todayId = null) =>
  rehabRepository
    .getSessions(PATIENT_PROFILE_PATIENT_ID)
    .map((session) => mapSessionToReport(session, todayId))
    .sort((a, b) => a.date - b.date);
