// src/pages/PatientExercises.jsx
import React, { useEffect, useMemo, useReducer, useState } from "react";
import { useTranslation } from "react-i18next";
import "../styles/PatientExercises.css";
import { useAuth } from "../../../../context/AuthContext";
import { ALL_EXERCISES } from "../data/patientExercisesData";
import { getRehabWeek, getTodaySessionPlan, getSessionTotals, getCompletedDaySummary, getWeekLabel, REHAB_DAY_STATUS } from "../data/patientRehabPlanData";
import {
  sessionReducer,
  createInitialSessionState,
  SESSION_STATUS,
  getSessionProgress,
  getSessionElapsedMs,
  getExerciseElapsedMs,
} from "../session/patientSessionEngine";
import { loadSessionState, saveSessionState, clearSessionState } from "../session/patientSessionStorage";
import { getSessionAverageQuality, getAverageRom } from "../session/patientSessionMetrics";
import { getSessionInsight } from "../session/patientSessionInsights";
import { getLatestPainLog, savePainLog, DEFAULT_PAIN_VALUE } from "../utils/patientPainStorage";
import { rehabRepository } from "../../../../domain/rehab/useRehabDomain";
import { PATIENT_PROFILE_PATIENT_ID } from "../../../../domain/rehab/demoData/patients";
import RehabDayRail from "../components/exercises/RehabDayRail";
import SessionHero from "../components/exercises/SessionHero";
import SessionExerciseSequence from "../components/exercises/SessionExerciseSequence";
import SessionReportModal from "../components/exercises/SessionReportModal";
import ExerciseDetailsModal from "../components/exercises/ExerciseDetailsModal";
import ExerciseInfoButton from "../components/exercises/ExerciseInfoButton";

/**
 * Patient Exercises — a guided rehabilitation SESSION experience
 * (Section 2's PROGRAM -> DAY -> SESSION -> EXERCISE model), not an
 * exercise-card catalog. See the final report for the full architecture;
 * in short:
 *
 *   data/patientRehabPlanData.js  — rehab week + today's prescription
 *   session/patientSessionEngine.js — the NOT_STARTED/ACTIVE/
 *     BETWEEN_EXERCISES/PAIN_CHECK/COMPLETED state machine (useReducer)
 *   session/patientSessionStorage.js — localStorage persistence (state
 *     transitions only, never per timer tick)
 *   session/patientSessionMetrics.js — mock/deterministic movement metrics
 *   session/patientSessionInsights.js — mock/deterministic KneeGuide
 *     insight selection
 *   components/exercises/* — the presentational pieces
 *
 * This page's own job is orchestration only: assembling the day/session
 * data, owning the reducer + persistence + the once-a-second visible
 * clock, and wiring the pieces together — no session business logic
 * lives directly in this component.
 *
 * The Exercise Library (previously "All Exercises") is preserved as a
 * secondary, reference-only destination (Section 25/31) — a compact list
 * of name + target/category + an info control, not the old image-card
 * grid. Selecting a Library row's info control opens the exact same
 * ExerciseDetailsModal a session row does — there is only ever one
 * exercise-instruction UI in this feature (Section 14/23).
 */

const TICKING_STATUSES = [SESSION_STATUS.ACTIVE, SESSION_STATUS.BETWEEN_EXERCISES, SESSION_STATUS.PAIN_CHECK];

const PatientExercises = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const displayName = user?.first_name?.trim() || t("patientDashboard.greeting.fallbackName");

  const [viewMode, setViewMode] = useState("session");

  // ---------- Exercise Details modal (UI-only state — never touches the session engine) ----------
  const [detailsExercise, setDetailsExercise] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Builds the view-model ExerciseDetailsModal renders. `planItem` is
  // only present when opened from today's session (carries the
  // session-specific prescription/target ROM); Library rows pass no
  // planItem, so the modal falls back to the catalog's own default reps
  // string and omits the KneeGuide tip entirely — see that component.
  const openExerciseDetails = (catalogExercise, planItem = null) => {
    if (!catalogExercise) return;
    setDetailsExercise({
      id: catalogExercise.id,
      name: t(catalogExercise.nameKey),
      target: catalogExercise.targetKey ? t(catalogExercise.targetKey) : null,
      purpose: t(catalogExercise.descriptionKey),
      image: catalogExercise.image,
      video: catalogExercise.video,
      prescriptionLabel: planItem
        ? t("patientExercises.session.setsReps", { sets: planItem.sets, reps: planItem.repsPerSet })
        : catalogExercise.reps,
      instructions: catalogExercise.instructionsKey ? t(catalogExercise.instructionsKey, { returnObjects: true }) : [],
      cues: catalogExercise.cuesKey ? t(catalogExercise.cuesKey, { returnObjects: true }) : [],
      mistakes: catalogExercise.mistakesKey ? t(catalogExercise.mistakesKey, { returnObjects: true }) : [],
      todaysTargetRange: planItem ? { min: planItem.targetRomMin, max: planItem.targetRomMax } : null,
    });
    setDetailsOpen(true);
  };

  // ---------- Rehab week / today's plan (stable for the page's lifetime) ----------
  const rehabWeek = useMemo(() => getRehabWeek(), []);
  const todayId = useMemo(() => rehabWeek.find((day) => day.status === REHAB_DAY_STATUS.TODAY)?.id, [rehabWeek]);
  const plan = useMemo(() => getTodaySessionPlan(), []);
  const totals = useMemo(() => getSessionTotals(plan), [plan]);
  const weekLabel = useMemo(() => t("patientExercises.session.weekLabel", { number: getWeekLabel() }), [t]);

  const [selectedDayId, setSelectedDayId] = useState(todayId);
  const selectedDay = rehabWeek.find((day) => day.id === selectedDayId) || rehabWeek.find((day) => day.status === REHAB_DAY_STATUS.TODAY);
  const isToday = selectedDay?.id === todayId;

  // ---------- Session state machine (restored from localStorage if it belongs to today) ----------
  const [sessionState, dispatch] = useReducer(sessionReducer, undefined, () => {
    const restored = loadSessionState(todayId);
    return restored || createInitialSessionState(todayId, plan);
  });

  // Persist on TRANSITIONS only (this effect only re-runs when `state`
  // itself changes, i.e. on a real dispatch) — never on the once-a-second
  // `now` tick below, which is separate, unpersisted component state.
  useEffect(() => {
    saveSessionState(sessionState);
  }, [sessionState]);

  // Once the guided session actually finishes, push it into the shared
  // rehab domain so the Doctor's Sessions/Overview/Reports/Assistant all
  // see it immediately (Section 18/56 Scenario B of the Doctor Patients
  // module brief: "Patient completes a session -> Doctor sees it"). A
  // stable id keyed on `todayId` (not a fresh random id) makes this
  // idempotent — a page reload/remount with an already-completed today
  // session must NOT create a second canonical record.
  useEffect(() => {
    if (sessionState.status !== SESSION_STATUS.COMPLETED || !todayId) return;
    const stableId = `live-${PATIENT_PROFILE_PATIENT_ID}-${todayId}`;
    if (rehabRepository.getSessionById(stableId)) return;

    rehabRepository.completeSession(PATIENT_PROFILE_PATIENT_ID, {
      id: stableId,
      date: sessionState.startedAt || new Date().toISOString(),
      startedAt: sessionState.startedAt,
      completedAt: sessionState.completedAt,
      painBefore: sessionState.painBefore,
      painAfter: sessionState.painAfter,
      exercises: sessionState.exercises.map((exercise) => ({
        id: exercise.id,
        completedSets: exercise.completedSets,
        totalSets: exercise.totalSets,
        rom: getAverageRom(exercise.setMetrics),
        qualityKey: getSessionAverageQuality([exercise]),
        durationMs: getExerciseElapsedMs(exercise, Date.now()),
      })),
    });
    // Only re-run when the session actually TRANSITIONS to COMPLETED, not
    // on every intermediate exercise/pain field mutation — those already
    // sit inside the same `sessionState` object read above at the moment
    // this fires, so the values are correct without listing them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionState.status, sessionState.completedAt, todayId]);

  // ONE lightweight visible-clock mechanism for the whole page (Section
  // 41) — a single interval, running only while something is actually
  // elapsing, driving a plain re-render tick. The reducer state itself
  // never stores this — see getSessionElapsedMs/getExerciseElapsedMs,
  // which always derive from timestamps.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!TICKING_STATUSES.includes(sessionState.status)) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [sessionState.status]);

  // ---------- Post-session pain check (reuses the existing Pain Logger capability) ----------
  const [painCheckValue, setPainCheckValue] = useState(DEFAULT_PAIN_VALUE);
  useEffect(() => {
    if (sessionState.status === SESSION_STATUS.PAIN_CHECK) {
      setPainCheckValue(sessionState.painBefore ?? DEFAULT_PAIN_VALUE);
    }
    // Only re-seed when the session actually ENTERS pain-check, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionState.status]);

  const handleStartSession = () => {
    const latest = getLatestPainLog();
    dispatch({ type: "START_SESSION", painBefore: latest ? latest.value : null });
  };

  const handleSubmitPainAfter = (value) => {
    savePainLog(value);
    dispatch({ type: "SUBMIT_PAIN_AFTER", value });
  };

  const handleSkipPainCheck = () => dispatch({ type: "SKIP_PAIN_CHECK" });

  const handleDevReset = () => {
    clearSessionState();
    dispatch({ type: "RESET", initialState: createInitialSessionState(todayId, plan) });
  };

  // ---------- Session report ----------
  const [reportOpen, setReportOpen] = useState(false);
  const [reportData, setReportData] = useState(null);

  const openTodayReport = () => {
    const progress = getSessionProgress(sessionState);
    const insight = getSessionInsight({ painBefore: sessionState.painBefore, painAfter: sessionState.painAfter });
    const exerciseBreakdown = sessionState.exercises.map((exercise, index) => ({
      id: exercise.id,
      name: plan[index]?.catalog ? t(plan[index].catalog.nameKey) : exercise.id,
      completedSets: exercise.completedSets,
      totalSets: exercise.totalSets,
      durationMs: getExerciseElapsedMs(exercise, now),
      averageRom: getAverageRom(exercise.setMetrics),
    }));

    setReportData({
      dateLabel: selectedDay.date.toLocaleDateString(i18n.language, { weekday: "long", month: "short", day: "numeric" }),
      durationMs: getSessionElapsedMs(sessionState, now),
      exerciseCount: progress.totalExercises,
      setCount: progress.totalSets,
      painBefore: sessionState.painBefore,
      painAfter: sessionState.painAfter,
      qualityKey: getSessionAverageQuality(sessionState.exercises),
      exerciseBreakdown,
      insight,
    });
    setReportOpen(true);
  };

  const openPastDayReport = (day) => {
    const summary = getCompletedDaySummary(day.id);
    setReportData({
      dateLabel: day.date.toLocaleDateString(i18n.language, { weekday: "long", month: "short", day: "numeric" }),
      durationMs: summary.durationMs,
      exerciseCount: summary.exerciseCount,
      setCount: summary.setCount,
      painBefore: summary.painBefore,
      painAfter: summary.painAfter,
      qualityKey: summary.qualityKey,
      exerciseBreakdown: null,
      insight: null,
    });
    setReportOpen(true);
  };

  return (
    <div className="pe-page">
      <div className="pe-inner">
        <header className="pe-header">
          <h1 className="pe-title">{t("patientExercises.header.title")}</h1>
          <p className="pe-subtitle">{t("patientExercises.header.subtitle")}</p>
        </header>

        <div className="pe-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "session"}
            className={`pe-tab ${viewMode === "session" ? "active" : ""}`}
            onClick={() => setViewMode("session")}
          >
            {t("patientExercises.session.todaysSessionTab")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "library"}
            className={`pe-tab ${viewMode === "library" ? "active" : ""}`}
            onClick={() => setViewMode("library")}
          >
            {t("patientExercises.session.exerciseLibrary")}
          </button>
        </div>

        {viewMode === "session" && selectedDay ? (
          <div className="pe-session-view">
            <RehabDayRail
              days={rehabWeek}
              selectedDayId={selectedDay.id}
              onSelect={setSelectedDayId}
              todayCompleted={sessionState.status === SESSION_STATUS.COMPLETED}
              weekLabel={weekLabel}
            />

            <SessionHero
              day={selectedDay}
              isToday={isToday}
              totals={totals}
              plan={plan}
              sessionState={sessionState}
              now={now}
              completedDaySummary={
                !isToday && selectedDay.status === REHAB_DAY_STATUS.COMPLETED ? getCompletedDaySummary(selectedDay.id) : null
              }
              patientName={displayName}
              onStartSession={handleStartSession}
              onOpenReport={isToday ? openTodayReport : () => openPastDayReport(selectedDay)}
              onDevReset={handleDevReset}
            />

            {isToday && (
              <SessionExerciseSequence
                plan={plan}
                sessionState={sessionState}
                now={now}
                dispatch={dispatch}
                painValue={painCheckValue}
                onPainValueChange={setPainCheckValue}
                onSubmitPain={handleSubmitPainAfter}
                onSkipPain={handleSkipPainCheck}
                onViewDetails={(planItem) => openExerciseDetails(planItem.catalog, planItem)}
              />
            )}
          </div>
        ) : (
          // Exercise Library — a compact REFERENCE list (Section 14/15/31),
          // not the old image-card grid. No "Start Exercise" control here
          // (Section 16) — the prescribed session is the only thing that
          // drives execution; this list only explains exercises via the
          // same ExerciseDetailsModal a session row opens.
          <div className="exercise-library">
            <p className="exercise-library-intro">{t("patientExercises.session.libraryIntro")}</p>
            <ul className="exercise-library-list">
              {ALL_EXERCISES.map((exercise) => {
                const name = t(exercise.nameKey);
                return (
                  <li key={exercise.id} className="exercise-library-row">
                    <div className="exercise-library-row-main">
                      <span className="exercise-library-row-name" dir="auto">
                        {name}
                      </span>
                      {exercise.targetKey && (
                        <span className="exercise-library-row-target" dir="auto">
                          {t(exercise.targetKey)}
                        </span>
                      )}
                    </div>
                    <ExerciseInfoButton exerciseName={name} onClick={() => openExerciseDetails(exercise)} />
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      <SessionReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} report={reportData} />
      <ExerciseDetailsModal isOpen={detailsOpen} onClose={() => setDetailsOpen(false)} exercise={detailsExercise} />
    </div>
  );
};

export default PatientExercises;
