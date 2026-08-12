import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { LuCheck } from "react-icons/lu";
import PatientButton from "../PatientButton";
import PatientPainLogger from "../PatientPainLogger";
import KneeGuideInsightCard from "./KneeGuideInsightCard";
import ExerciseInfoButton from "./ExerciseInfoButton";
import {
  SESSION_STATUS,
  EXERCISE_STATUS,
  getExerciseElapsedMs,
  formatClock,
} from "../../session/patientSessionEngine";
import { SENSOR_CONNECTED, generateSetMetrics, getAverageRom } from "../../session/patientSessionMetrics";
import { getExerciseInsight } from "../../session/patientSessionInsights";
import "./SessionExerciseSequence.css";

/**
 * The set-track row for the currently ACTIVE exercise — "Set 1 ✓ / Set 2
 * ACTIVE / Set 3 —". Status is never color-only: each state has its own
 * icon/text, color only reinforces it (Section 39).
 */
const SetTrack = ({ totalSets, completedSets, t }) => (
  <ol className="session-set-track">
    {Array.from({ length: totalSets }, (_, index) => {
      const isDone = index < completedSets;
      const isActive = index === completedSets;
      return (
        <li
          key={index}
          className={[
            "session-set-track-item",
            isDone && "session-set-track-item--done",
            isActive && "session-set-track-item--active",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <span className="session-set-track-index">
            {isDone ? <LuCheck aria-hidden="true" /> : index + 1}
          </span>
          <span className="session-set-track-label">
            {isDone
              ? t("patientExercises.session.setStatus.done")
              : isActive
              ? t("patientExercises.session.setStatus.active")
              : t("patientExercises.session.setStatus.pending")}
          </span>
        </li>
      );
    })}
  </ol>
);

/**
 * The expanded card for whichever exercise is currently ACTIVE — sets,
 * reps, exercise timer, mock movement metrics (or the "sensor not
 * connected" fallback), and the Complete Set control. Only one of these
 * is ever rendered at a time (Section 8/9).
 */
const ActiveExerciseCard = ({ exercise, planItem, now, dispatch, t }) => {
  const submittingSetRef = useRef(false);
  // Reset the double-click guard only once the set count this component
  // is showing has actually advanced — i.e. once the dispatched action
  // really took effect, not on every unrelated re-render.
  useEffect(() => {
    submittingSetRef.current = false;
  }, [exercise.completedSets]);

  const elapsedMs = getExerciseElapsedMs(exercise, now);
  const setIndex = exercise.completedSets;
  const previewMetrics = generateSetMetrics({
    baseRom: planItem.baseRom,
    targetRomMax: planItem.targetRomMax,
    setIndex,
  });

  const handleCompleteSet = () => {
    if (submittingSetRef.current) return;
    submittingSetRef.current = true;

    dispatch({ type: "COMPLETE_SET", metrics: previewMetrics });
    if (setIndex + 1 >= exercise.totalSets) {
      dispatch({ type: "COMPLETE_EXERCISE" });
    }
  };

  return (
    <div className="session-active-exercise">
      <SetTrack totalSets={exercise.totalSets} completedSets={exercise.completedSets} t={t} />

      <p className="session-active-exercise-set-label">
        {t("patientExercises.session.setLabel", { current: exercise.completedSets + 1, total: exercise.totalSets })}
      </p>
      <p className="session-active-exercise-reps">{t("patientExercises.session.repsLabel", { count: planItem.repsPerSet })}</p>

      <div className="session-active-exercise-metrics">
        <div>
          <span className="session-active-exercise-metric-label">{t("patientExercises.session.exerciseTime")}</span>
          <span className="session-active-exercise-metric-value" dir="ltr">
            {formatClock(elapsedMs)}
          </span>
        </div>

        {SENSOR_CONNECTED ? (
          <>
            <div>
              <span className="session-active-exercise-metric-label">{t("patientExercises.session.movementQuality")}</span>
              <span className="session-active-exercise-metric-value">
                {t(`patientExercises.session.quality.${previewMetrics.qualityKey}`)}
              </span>
            </div>
            <div>
              <span className="session-active-exercise-metric-label">{t("patientExercises.session.range")}</span>
              <span className="session-active-exercise-metric-value" dir="ltr">
                {previewMetrics.rom}°
              </span>
            </div>
            <div>
              <span className="session-active-exercise-metric-label">{t("patientExercises.session.target")}</span>
              <span className="session-active-exercise-metric-value" dir="ltr">
                {planItem.targetRomMin}–{planItem.targetRomMax}°
              </span>
            </div>
          </>
        ) : (
          <p className="session-sensor-fallback" role="status">
            {t("patientExercises.session.sensorNotConnected")}
          </p>
        )}
      </div>

      <PatientButton type="button" variant="primary" onClick={handleCompleteSet}>
        {t("patientExercises.session.completeSet")}
      </PatientButton>
    </div>
  );
};

/** The KneeGuide Insight shown between two exercises (or before the final pain check). */
const BetweenExercisesInsight = ({ sessionState, plan, dispatch, t }) => {
  const index = sessionState.currentExerciseIndex;
  const exercise = sessionState.exercises[index];
  const planItem = plan[index];
  const averageRom = getAverageRom(exercise.setMetrics);
  const insight = getExerciseInsight({ averageRom, previousRom: planItem.previous.rom });
  const isLast = index >= plan.length - 1;
  const nextPlanItem = !isLast ? plan[index + 1] : null;
  const nextName = nextPlanItem?.catalog ? t(nextPlanItem.catalog.nameKey) : "";

  return (
    <KneeGuideInsightCard
      title={t("patientExercises.session.insightTitle")}
      message={t(insight.messageKey, insight.values)}
      tone={insight.severity}
    >
      <PatientButton type="button" variant="primary" size="sm" onClick={() => dispatch({ type: "CONTINUE_TO_NEXT_EXERCISE" })}>
        {isLast ? t("patientExercises.session.finishSession") : t("patientExercises.session.continueTo", { name: nextName })}
      </PatientButton>
    </KneeGuideInsightCard>
  );
};

const PainCheck = ({ painValue, onPainValueChange, onSubmitPain, onSkipPain, t }) => (
  <div className="session-pain-check">
    <h3 className="session-pain-check-title">{t("patientExercises.session.painCheckPrompt")}</h3>
    <PatientPainLogger value={painValue} onChange={onPainValueChange} />
    <div className="session-pain-check-actions">
      <PatientButton type="button" variant="primary" size="sm" onClick={() => onSubmitPain(painValue)}>
        {t("patientDashboard.assistant.painLogger.submit")}
      </PatientButton>
      <PatientButton type="button" variant="ghost" size="sm" onClick={onSkipPain}>
        {t("patientExercises.session.skipPainCheck")}
      </PatientButton>
    </div>
  </div>
);

/**
 * The step-by-step exercise sequence for TODAY's session — rendered
 * regardless of whether the session has started yet (upcoming rows only,
 * before Start) through completion (every row shows its frozen duration).
 * Exactly one exercise is ever expanded (the ACTIVE one) — everything
 * else stays a compact row, per Section 8's "don't expand everything at
 * once" requirement.
 */
const SessionExerciseSequence = ({
  plan,
  sessionState,
  now,
  dispatch,
  painValue,
  onPainValueChange,
  onSubmitPain,
  onSkipPain,
  onViewDetails,
}) => {
  const { t } = useTranslation();

  return (
    <div className="session-exercise-sequence">
      <ol className="session-exercise-steps">
        {plan.map((planItem, index) => {
          const exercise = sessionState.exercises[index];
          const name = planItem.catalog ? t(planItem.catalog.nameKey) : planItem.exerciseId;
          const isActive = exercise.status === EXERCISE_STATUS.ACTIVE;
          const isCompleted = exercise.status === EXERCISE_STATUS.COMPLETED;

          return (
            <li
              key={planItem.exerciseId}
              className={[
                "session-exercise-step",
                isActive && "session-exercise-step--active",
                isCompleted && "session-exercise-step--completed",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="session-exercise-step-header">
                <span className="session-exercise-step-index">{String(index + 1).padStart(2, "0")}</span>
                <div className="session-exercise-step-title">
                  <div className="session-exercise-step-name-row">
                    <h3 dir="auto">{name}</h3>
                    <ExerciseInfoButton exerciseName={name} onClick={() => onViewDetails(planItem)} />
                  </div>
                  <p>
                    {planItem.repsPerSet != null
                      ? t("patientExercises.session.setsReps", { sets: planItem.sets, reps: planItem.repsPerSet })
                      : t("patientExercises.session.setsDuration", { sets: planItem.sets, seconds: planItem.durationSeconds })}
                  </p>
                </div>
                <span className="session-exercise-step-badge">
                  {isCompleted && <LuCheck aria-hidden="true" />}
                  {isCompleted
                    ? t("patientExercises.session.setStatus.done")
                    : isActive
                    ? t("patientExercises.session.setStatus.active")
                    : t("patientExercises.session.setStatus.pending")}
                </span>
              </div>

              {!isActive && !isCompleted && (
                <p className="session-exercise-step-preview">
                  {t("patientExercises.session.target")}: {planItem.catalog ? t(planItem.catalog.targetKey) : ""} ·{" "}
                  {t("patientExercises.session.estimated", { minutes: planItem.estimatedMinutes })}
                  {planItem.previous && (
                    <>
                      {" · "}
                      {t("patientExercises.session.previousSession")}: {t(`patientExercises.session.quality.${planItem.previous.qualityKey}`)}
                      {typeof planItem.previous.rom === "number" && (
                        <>
                          ,{" "}
                          <span dir="ltr">{t("patientExercises.session.previousRom", { value: planItem.previous.rom })}</span>
                        </>
                      )}
                    </>
                  )}
                </p>
              )}

              {isActive && <ActiveExerciseCard exercise={exercise} planItem={planItem} now={now} dispatch={dispatch} t={t} />}

              {isCompleted && (
                <p className="session-exercise-step-completed-duration" dir="auto">
                  {t("patientExercises.session.completedIn", { time: formatClock(getExerciseElapsedMs(exercise, now)) })}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      {sessionState.status === SESSION_STATUS.BETWEEN_EXERCISES && (
        <BetweenExercisesInsight sessionState={sessionState} plan={plan} dispatch={dispatch} t={t} />
      )}

      {sessionState.status === SESSION_STATUS.PAIN_CHECK && (
        <PainCheck
          painValue={painValue}
          onPainValueChange={onPainValueChange}
          onSubmitPain={onSubmitPain}
          onSkipPain={onSkipPain}
          t={t}
        />
      )}
    </div>
  );
};

export default SessionExerciseSequence;
