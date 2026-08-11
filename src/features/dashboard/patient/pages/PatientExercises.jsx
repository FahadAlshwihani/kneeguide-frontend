// src/pages/PatientExercises.jsx
import React, { useEffect, useMemo, useReducer, useState } from "react";
import { useTranslation } from "react-i18next";
import "../styles/PatientExercises.css";
import ExerciseCard from "../../shared/components/ExerciseCard";
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
import RehabDayRail from "../components/exercises/RehabDayRail";
import SessionHero from "../components/exercises/SessionHero";
import SessionExerciseSequence from "../components/exercises/SessionExerciseSequence";
import SessionReportModal from "../components/exercises/SessionReportModal";

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
 * secondary destination (Section 25) — same ExerciseCard/video-modal
 * behavior as before, just no longer the page's primary experience.
 */

const resolveExercise = (t, exercise) => ({
  name: t(exercise.nameKey),
  reps: exercise.reps,
  lastDone: t(exercise.lastDoneKey),
  progress: exercise.progress,
  image: exercise.image,
  video: exercise.video,
  description: t(exercise.descriptionKey),
});

const TICKING_STATUSES = [SESSION_STATUS.ACTIVE, SESSION_STATUS.BETWEEN_EXERCISES, SESSION_STATUS.PAIN_CHECK];

const PatientExercises = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const displayName = user?.first_name?.trim() || t("patientDashboard.greeting.fallbackName");

  const [viewMode, setViewMode] = useState("session");
  const [activeLibraryExercise, setActiveLibraryExercise] = useState(null);

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

  // ---------- Exercise Library (secondary destination — unchanged behavior) ----------
  const libraryExercises = ALL_EXERCISES.map((exercise) => resolveExercise(t, exercise));

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
              />
            )}
          </div>
        ) : (
          <div className="pe-list">
            {libraryExercises.map((ex, idx) => (
              <ExerciseCard
                key={idx}
                name={ex.name}
                reps={ex.reps}
                lastDoneLabel={t("patientExercises.labels.lastDone")}
                lastDone={ex.lastDone}
                progress={ex.progress}
                image={ex.image}
                startLabel={t("patientExercises.buttons.start")}
                onStart={() => setActiveLibraryExercise(ex)}
              />
            ))}
          </div>
        )}

        {/* Exercise Library video modal — unchanged from before this round. */}
        {activeLibraryExercise && (
          <div className="pe-modal-backdrop" onClick={() => setActiveLibraryExercise(null)}>
            <div className="pe-modal" onClick={(e) => e.stopPropagation()}>
              <h2 className="pe-modal-title">{activeLibraryExercise.name}</h2>

              <div className="pe-video-wrapper">
                <iframe
                  src={activeLibraryExercise.video.replace("watch?v=", "embed/")}
                  title="Exercise Video"
                  allowFullScreen
                />
              </div>

              <p className="pe-modal-text">{activeLibraryExercise.description}</p>

              <button className="pe-close-btn" onClick={() => setActiveLibraryExercise(null)}>
                {t("patientExercises.buttons.close")}
              </button>
            </div>
          </div>
        )}
      </div>

      <SessionReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} report={reportData} />
    </div>
  );
};

export default PatientExercises;
