/**
 * MOCK sensor-derived exercise metrics — NOT real IMU/sensor data. There
 * is no sensor stream anywhere in this project (audited before writing
 * this — see the KneeGuide device capability, which is itself a mock
 * Bluetooth scan/connect flow, not a data stream). Deliberately
 * deterministic (no `Math.random`) so a demo session/set always produces
 * the same numbers on replay — that's what makes it testable and
 * reviewable, not a shortcut.
 *
 * `SENSOR_CONNECTED` is the seam a real future integration would flip:
 * the active-exercise UI (SessionExerciseSequence.jsx) checks this flag
 * and falls back to "Sensor not connected — tracking continues
 * manually" instead of hiding/breaking the set-by-set flow when it's
 * `false`. It's `true` here only so this iteration can actually show the
 * intended metrics experience end to end; flipping it to `false` is a
 * one-line way to see the graceful fallback path this architecture
 * already supports.
 */

export const SENSOR_CONNECTED = true;

export const MOVEMENT_QUALITY = {
  FAIR: "fair",
  GOOD: "good",
  EXCELLENT: "excellent",
};

/**
 * One set's mock metrics. `baseRom`/`targetRomMin`/`targetRomMax` come
 * from the exercise's plan entry (patientRehabPlanData.js); `setIndex` is
 * 0-based. A small deterministic upward drift across sets within the
 * same exercise stands in for "the patient warms into the movement" —
 * clamped to stay within a plausible band of the target range rather
 * than drifting unboundedly.
 */
export const generateSetMetrics = ({ baseRom, targetRomMax, setIndex }) => {
  const rom = Math.min(targetRomMax + 4, baseRom + setIndex * 2);
  const qualityKey = setIndex % 2 === 0 ? MOVEMENT_QUALITY.GOOD : MOVEMENT_QUALITY.EXCELLENT;
  return { rom, qualityKey };
};

/** Average ROM across an exercise's recorded sets — 0 if none yet. */
export const getAverageRom = (setMetrics) => {
  const values = setMetrics.filter(Boolean).map((m) => m.rom);
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
};

const QUALITY_RANK = { [MOVEMENT_QUALITY.FAIR]: 0, [MOVEMENT_QUALITY.GOOD]: 1, [MOVEMENT_QUALITY.EXCELLENT]: 2 };
const QUALITY_BY_RANK = [MOVEMENT_QUALITY.FAIR, MOVEMENT_QUALITY.GOOD, MOVEMENT_QUALITY.EXCELLENT];

/** Session-wide average movement-quality label across every recorded set. */
export const getSessionAverageQuality = (exercises) => {
  const ranks = exercises
    .flatMap((exercise) => exercise.setMetrics)
    .filter(Boolean)
    .map((metric) => QUALITY_RANK[metric.qualityKey] ?? 1);
  if (ranks.length === 0) return MOVEMENT_QUALITY.GOOD;
  const avgRank = Math.round(ranks.reduce((sum, r) => sum + r, 0) / ranks.length);
  return QUALITY_BY_RANK[Math.min(2, Math.max(0, avgRank))];
};

/**
 * Overall session ROM trend vs. each exercise's own previous-session
 * value — averaged across exercises that recorded at least one set, so
 * one exercise's dip doesn't hide another's gain, and rounded to a whole
 * degree for a clean "+4°"-style headline number.
 */
export const getSessionRomTrend = (exercises, plan) => {
  const deltas = exercises
    .map((exercise) => {
      if (exercise.setMetrics.length === 0) return null;
      const planEntry = plan.find((item) => item.exerciseId === exercise.id);
      if (!planEntry || typeof planEntry.previous?.rom !== "number") return null;
      return getAverageRom(exercise.setMetrics) - planEntry.previous.rom;
    })
    .filter((value) => value !== null);
  if (deltas.length === 0) return 0;
  return Math.round(deltas.reduce((sum, v) => sum + v, 0) / deltas.length);
};
