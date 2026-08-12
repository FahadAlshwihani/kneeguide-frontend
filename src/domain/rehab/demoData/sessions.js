import { SESSION_SOURCE } from "../rehabEnums";

/**
 * THE canonical SESSION EXECUTION history — "what actually happened",
 * per patient, per exercise. Seed data below is what makes a Doctor
 * Sessions tab and a Patient Reports/session history agree on the same
 * facts on first load, before any live play-through adds more.
 *
 * Ahmed's five seed sessions reconcile TWO pre-refactor sources that used
 * to silently disagree (Section 35 of the brief):
 *   - the Doctor Home Assistant's doctorClinicalMockData.js AHMED record
 *     (`flexionSeries: [101,107,112,118,114]`,
 *      `painSeries: [5.6,5.0,4.4,3.8,7.0]`) — kept EXACTLY, since it's
 *     already reachable/approved via the Doctor Home Assistant;
 *   - the Patient side's data/patientReportsData.js detailed fixtures
 *     (per-exercise breakdown shape: id/completedSets/totalSets/rom/
 *     qualityKey/durationMs) — that per-exercise SHAPE is reused here,
 *     with per-session values now derived to match the flexion/pain
 *     series above instead of an independently-invented set of numbers.
 * The result: Ahmed's "latest session had a pain spike and a small ROM
 * dip" is now ONE fact, visible identically from the Doctor Assistant,
 * the Doctor Sessions/Reports tabs, and (once wired) the Patient side.
 *
 * Dates are relative to "now" (`dayOffset`, same convention every other
 * demo-data module in this app already uses) so the seed never goes
 * chronologically stale. Ahmed's most recent seed session is yesterday
 * (`-1`), not today — today is deliberately left open for a real, live
 * play-through of PatientExercises.jsx to add one more actual session on
 * top (`completeSession()`), without colliding with a seeded "today."
 */

const HALF_MIN = 30000;

const dayOffset = (offset, referenceDate = new Date()) => {
  const date = new Date(referenceDate);
  date.setHours(18, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
};

const exerciseEntry = (id, completedSets, totalSets, rom, qualityKey, durationMs) => ({
  id,
  completedSets,
  totalSets,
  rom,
  qualityKey,
  durationMs,
});

const buildAhmedSessions = (referenceDate) => {
  // flexion/pain series, oldest -> newest, EXACTLY doctorClinicalMockData's AHMED record.
  const flexionSeries = [101, 107, 112, 118, 114];
  const painAfterSeries = [5.6, 5.0, 4.4, 3.8, 7.0];
  const painBeforeSeries = [6.2, 5.6, 5.0, 4.4, 4.0];
  const qualityByIndex = ["good", "good", "excellent", "excellent", "fair"];
  const dayOffsets = [-5, -4, -3, -2, -1];

  return dayOffsets.map((offset, index) => {
    const date = dayOffset(offset, referenceDate);
    const flexion = flexionSeries[index];
    const quality = qualityByIndex[index];
    return {
      id: `sess-ahmed-${index + 1}`,
      patientId: "patient-ahmed",
      date: date.toISOString(),
      startedAt: date.toISOString(),
      completedAt: new Date(date.getTime() + 18 * 60000).toISOString(),
      status: "completed",
      painBefore: painBeforeSeries[index],
      painAfter: painAfterSeries[index],
      exercises: [
        exerciseEntry("quadSets", 3, 3, flexion - 2, quality, 258000),
        exerciseEntry("legRaises", 3, 3, flexion - 8, quality, 312000),
        exerciseEntry("heelSlides", 3, 3, flexion + 4, quality, 290000),
      ],
      reviewed: index < 4, // every session but the latest (the flagged one) has already been reviewed
      doctorNoteId: index < 4 ? null : null,
      source: SESSION_SOURCE.SEED,
    };
  });
};

const buildSaraSessions = (referenceDate) => {
  // Adherence concern: only 2 of 4 prescribed-this-week sessions completed, one skipped gap visible.
  const dayOffsets = [-6, -2];
  return dayOffsets.map((offset, index) => {
    const date = dayOffset(offset, referenceDate);
    return {
      id: `sess-sara-${index + 1}`,
      patientId: "patient-sara",
      date: date.toISOString(),
      startedAt: date.toISOString(),
      completedAt: new Date(date.getTime() + 14 * 60000).toISOString(),
      status: "completed",
      painBefore: 4,
      painAfter: 4,
      exercises: [
        exerciseEntry("quadSets", 3, 3, 64 + index * 2, "fair", 240000),
        exerciseEntry("hamstring", 2, 2, null, "fair", 60000),
      ],
      reviewed: false,
      doctorNoteId: null,
      source: SESSION_SOURCE.SEED,
    };
  });
};

const buildMohammedSessions = (referenceDate) => {
  // Stable, positive: consistent completion (4 of 4 prescribed sessions
  // within the trailing 7-day adherence window — matches
  // rx-mohammed-*'s frequencyPerWeek: 4), improving ROM, low/declining pain.
  const dayOffsets = [-6, -5, -3, -1];
  const flexionSeries = [96, 101, 106, 110];
  const painSeries = [5, 4, 3, 3];
  return dayOffsets.map((offset, index) => {
    const date = dayOffset(offset, referenceDate);
    return {
      id: `sess-mohammed-${index + 1}`,
      patientId: "patient-mohammed",
      date: date.toISOString(),
      startedAt: date.toISOString(),
      completedAt: new Date(date.getTime() + 16 * 60000).toISOString(),
      status: "completed",
      painBefore: painSeries[index] + 1,
      painAfter: painSeries[index],
      exercises: [
        exerciseEntry("heelSlides", 3, 3, flexionSeries[index], "excellent", 300000),
        exerciseEntry("calfRaises", 3, 3, null, "excellent", 240000),
      ],
      reviewed: true,
      doctorNoteId: null,
      source: SESSION_SOURCE.SEED,
    };
  });
};

const buildLamaSessions = (referenceDate) => {
  // On track with her (lighter, 2x/week) prescribed cadence — her only
  // flagged signal is the pending appointment request, not adherence.
  const dayOffsets = [-4, -1];
  return dayOffsets.map((offset, index) => {
    const date = dayOffset(offset, referenceDate);
    return {
      id: `sess-lama-${index + 1}`,
      patientId: "patient-lama",
      date: date.toISOString(),
      startedAt: date.toISOString(),
      completedAt: new Date(date.getTime() + 12 * 60000).toISOString(),
      status: "completed",
      painBefore: 3,
      painAfter: 3,
      exercises: [
        exerciseEntry("quadSets", 3, 3, 66 + index * 2, "good", 220000),
        exerciseEntry("legRaises", 3, 3, 60 + index * 2, "good", 260000),
      ],
      reviewed: index === 0,
      doctorNoteId: null,
      source: SESSION_SOURCE.SEED,
    };
  });
};

export const buildInitialSessions = (referenceDate = new Date()) => [
  ...buildAhmedSessions(referenceDate),
  ...buildSaraSessions(referenceDate),
  ...buildMohammedSessions(referenceDate),
  ...buildLamaSessions(referenceDate),
];

export const HALF_MIN_MS = HALF_MIN;
