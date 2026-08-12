import { REPORT_STATUS } from "../rehabEnums";

/**
 * HISTORICAL report snapshots only (Section 58 of the brief — "Historical
 * reports may intentionally store snapshot metrics... a Week 5 report
 * should not silently change later"). These are frozen and never
 * recomputed from live session data.
 *
 * The CURRENT period's report for every patient is deliberately NOT here
 * — it is generated once at repository init (and re-generatable on demand)
 * by rehabDerived.js's `generateReportSnapshot()`, directly from the
 * seeded sessions in sessions.js, so it can never independently disagree
 * with what the Sessions tab shows (Section 23: "Do not maintain
 * independent hardcoded report facts that contradict sessions").
 */

const dayOffset = (offset, referenceDate = new Date()) => {
  const date = new Date(referenceDate);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
};

export const buildInitialReports = (referenceDate = new Date()) => [
  {
    id: "rpt-ahmed-week5",
    patientId: "patient-ahmed",
    periodStart: dayOffset(-12, referenceDate).toISOString(),
    periodEnd: dayOffset(-6, referenceDate).toISOString(),
    generatedAt: dayOffset(-5, referenceDate).toISOString(),
    sessionsCompleted: 5,
    sessionsExpected: 5,
    adherencePercent: 100,
    painTrend: { from: 6.0, to: 4.4 },
    romTrend: { from: 92, to: 101 },
    flags: [],
    reviewStatus: REPORT_STATUS.REVIEWED,
    reviewedAt: dayOffset(-4, referenceDate).toISOString(),
    reviewerNote: "rehabDomain.reports.seedNotes.ahmedWeek5",
    isLive: false,
  },
  {
    id: "rpt-sara-week1",
    patientId: "patient-sara",
    periodStart: dayOffset(-14, referenceDate).toISOString(),
    periodEnd: dayOffset(-8, referenceDate).toISOString(),
    generatedAt: dayOffset(-7, referenceDate).toISOString(),
    sessionsCompleted: 2,
    sessionsExpected: 4,
    adherencePercent: 50,
    painTrend: { from: 5, to: 4 },
    romTrend: { from: 58, to: 62 },
    flags: ["missed_sessions"],
    reviewStatus: REPORT_STATUS.REVIEWED,
    reviewedAt: dayOffset(-6, referenceDate).toISOString(),
    reviewerNote: "rehabDomain.reports.seedNotes.saraWeek1",
    isLive: false,
  },
];
