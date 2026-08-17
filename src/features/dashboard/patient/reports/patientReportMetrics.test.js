import {
  getPainValue,
  getFlexionValue,
  getExtensionValue,
  sortChronological,
  filterByRange,
  getAveragePain,
  getPreviousWindowAverage,
  getBoundaryValues,
  getDelta,
  getCompletionCounts,
  getCompletionRate,
  getPercentChange,
  getMilestones,
} from "./patientReportMetrics";

const report = (overrides = {}) => ({
  id: "r1",
  date: new Date("2024-01-01"),
  pain: {},
  rom: {},
  sessionStatus: "completed",
  ...overrides,
});

describe("value getters", () => {
  test("getPainValue prefers pain.after, falls back to pain.before, then null", () => {
    expect(getPainValue(report({ pain: { after: 2, before: 5 } }))).toBe(2);
    expect(getPainValue(report({ pain: { before: 5 } }))).toBe(5);
    expect(getPainValue(report({ pain: {} }))).toBeNull();
  });

  test("getFlexionValue/getExtensionValue return the number or null", () => {
    expect(getFlexionValue(report({ rom: { flexion: 110 } }))).toBe(110);
    expect(getFlexionValue(report({ rom: {} }))).toBeNull();
    expect(getExtensionValue(report({ rom: { extension: -3 } }))).toBe(-3);
    expect(getExtensionValue(report({ rom: {} }))).toBeNull();
  });
});

describe("sortChronological", () => {
  test("sorts ascending by date without mutating the input array", () => {
    const newer = report({ id: "newer", date: new Date("2024-02-01") });
    const older = report({ id: "older", date: new Date("2024-01-01") });
    const input = [newer, older];

    const sorted = sortChronological(input);

    expect(sorted.map((r) => r.id)).toEqual(["older", "newer"]);
    expect(input).toEqual([newer, older]); // original order untouched
  });
});

describe("filterByRange", () => {
  const referenceDate = new Date("2024-01-31T00:00:00");
  const withinRange = report({ id: "within", date: new Date("2024-01-28") });
  const outsideRange = report({ id: "outside", date: new Date("2023-12-01") });

  test("returns all reports when rangeDays is null/falsy", () => {
    expect(filterByRange([withinRange, outsideRange], null, referenceDate)).toEqual([withinRange, outsideRange]);
  });

  test("keeps only reports within the last N days of the reference date", () => {
    expect(filterByRange([withinRange, outsideRange], 7, referenceDate)).toEqual([withinRange]);
  });
});

describe("averages and deltas", () => {
  const chronological = [
    report({ id: "a", pain: { after: 6 }, rom: { flexion: 90 } }),
    report({ id: "b", pain: { after: 4 }, rom: { flexion: 100 } }),
    report({ id: "c", pain: {}, rom: {} }), // no values — should be skipped by averages
    report({ id: "d", pain: { after: 2 }, rom: { flexion: 110 } }),
  ];

  test("getAveragePain ignores missing values and returns null for an empty list", () => {
    expect(getAveragePain(chronological)).toBeCloseTo(4);
    expect(getAveragePain([])).toBeNull();
  });

  test("getPreviousWindowAverage returns null with no earlier history", () => {
    expect(getPreviousWindowAverage(chronological, [chronological[0]], getPainValue)).toBeNull();
    expect(getPreviousWindowAverage(chronological, [], getPainValue)).toBeNull();
  });

  test("getPreviousWindowAverage averages the window immediately before the current window", () => {
    const currentWindow = [chronological[3]]; // "d"
    // Window before "d" (size default 5, but only 3 reports precede it): a, b, c
    expect(getPreviousWindowAverage(chronological, currentWindow, getPainValue)).toBeCloseTo((6 + 4) / 2);
  });

  test("getBoundaryValues returns the first/last reports that actually have a value", () => {
    expect(getBoundaryValues(chronological, getFlexionValue)).toEqual({ oldest: 90, newest: 110 });
    expect(getBoundaryValues([], getFlexionValue)).toEqual({ oldest: null, newest: null });
  });

  test("getDelta is newest - oldest, or null with zero data points", () => {
    expect(getDelta(chronological, getFlexionValue)).toBe(20);
    expect(getDelta([], getFlexionValue)).toBeNull();
  });

  test("getDelta is 0 when only a single data point exists (oldest === newest)", () => {
    expect(getDelta([chronological[0]], getFlexionValue)).toBe(0);
  });
});

describe("completion stats", () => {
  const reports = [
    report({ sessionStatus: "completed" }),
    report({ sessionStatus: "completed" }),
    report({ sessionStatus: "missed" }),
  ];

  test("getCompletionCounts tallies completed vs total", () => {
    expect(getCompletionCounts(reports)).toEqual({ completed: 2, total: 3 });
  });

  test("getCompletionRate divides completed by total, and is null for an empty list", () => {
    expect(getCompletionRate(reports)).toBeCloseTo(2 / 3);
    expect(getCompletionRate([])).toBeNull();
  });
});

describe("getPercentChange", () => {
  test("positive result means the value went down (lower-is-better direction)", () => {
    expect(getPercentChange(10, 6)).toBeCloseTo(40);
  });

  test("returns null for a zero or non-numeric baseline", () => {
    expect(getPercentChange(0, 5)).toBeNull();
    expect(getPercentChange(null, 5)).toBeNull();
    expect(getPercentChange(10, null)).toBeNull();
  });
});

describe("getMilestones", () => {
  test("aggregates best flexion, lowest pain, and completion counts", () => {
    const reports = [
      report({ pain: { after: 6 }, rom: { flexion: 90 }, sessionStatus: "completed" }),
      report({ pain: { after: 2 }, rom: { flexion: 120 }, sessionStatus: "missed" }),
    ];

    expect(getMilestones(reports)).toEqual({
      bestFlexion: 120,
      lowestPain: 2,
      sessionsTracked: 2,
      completedSessions: 1,
    });
  });

  test("returns nulls for flexion/pain when no report has a value", () => {
    expect(getMilestones([report({ pain: {}, rom: {} })])).toEqual({
      bestFlexion: null,
      lowestPain: null,
      sessionsTracked: 1,
      completedSessions: 1,
    });
  });
});
