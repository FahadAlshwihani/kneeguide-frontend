import React, { useMemo, useState } from "react";
import "../styles/Reports.css";
import { useTranslation } from "react-i18next";

const Reports = () => {
  const { t } = useTranslation();

  const sessions = [
    {
      id: 1,
      date: "2025-11-01",
      painLevel: 6,
      flexion: 90,
      extension: -5,
      completed: true,
    },
    {
      id: 2,
      date: "2025-11-03",
      painLevel: 5,
      flexion: 100,
      extension: -3,
      completed: true,
    },
    {
      id: 3,
      date: "2025-11-05",
      painLevel: 4,
      flexion: 110,
      extension: -2,
      completed: true,
    },
    {
      id: 4,
      date: "2025-11-08",
      painLevel: 3,
      flexion: 120,
      extension: 0,
      completed: true,
    },
    {
      id: 5,
      date: "2025-11-10",
      painLevel: 3,
      flexion: 125,
      extension: 0,
      completed: false,
    },
  ];

  const [range, setRange] = useState("30");
  const [sortBy, setSortBy] = useState("date-desc");

  // Sorting + Filtering
  const filteredSessions = useMemo(() => {
    const list = [...sessions];

    if (sortBy === "date-desc")
      list.sort((a, b) => new Date(b.date) - new Date(a.date));
    if (sortBy === "date-asc")
      list.sort((a, b) => new Date(a.date) - new Date(b.date));
    if (sortBy === "pain-desc") list.sort((a, b) => b.painLevel - a.painLevel);
    if (sortBy === "pain-asc") list.sort((a, b) => a.painLevel - b.painLevel);

    return list;
  }, [sortBy]);

  const avgPain =
    sessions.reduce((sum, s) => sum + s.painLevel, 0) / sessions.length;

  const flexionImprovement =
    sessions[sessions.length - 1].flexion - sessions[0].flexion;

  const completionRate =
    (sessions.filter((s) => s.completed).length / sessions.length) * 100;

  const painEmoji = (p) =>
    p <= 2 ? "😊" : p <= 5 ? "😐" : p <= 7 ? "😣" : "😫";

  return (
    <>
      <div className="reports-page patient-version">
        <div className="reports-wrapper">
          {/* HEADER */}
          <header className="reports-header">
            <h1>{t("patientReports.header.title")}</h1>
            <p>{t("patientReports.header.subtitle")}</p>
          </header>

          {/* FILTERS + SUMMARY */}
          <div className="reports-top-row">
            {/* FILTERS */}
            <div className="reports-filters">
              <div className="filter-group">
                <label>{t("patientReports.filters.range")}</label>
                <select
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                >
                  <option value="7">{t("patientReports.range.last7")}</option>
                  <option value="30">{t("patientReports.range.last30")}</option>
                  <option value="90">{t("patientReports.range.last90")}</option>
                </select>
              </div>

              <div className="filter-group">
                <label>{t("patientReports.filters.sortBy")}</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="date-desc">
                    {t("patientReports.sort.newest")}
                  </option>
                  <option value="date-asc">
                    {t("patientReports.sort.oldest")}
                  </option>
                  <option value="pain-desc">
                    {t("patientReports.sort.painHigh")}
                  </option>
                  <option value="pain-asc">
                    {t("patientReports.sort.painLow")}
                  </option>
                </select>
              </div>
            </div>

            {/* SUMMARY CARDS */}
            <div className="reports-summary">
              <div className="summary-card">
                <p className="label">{t("patientReports.summary.avgPain")}</p>
                <h3>{avgPain.toFixed(1)}/10</h3>
                <span className="hint">
                  {t("patientReports.summary.hintSessions")}
                </span>
              </div>

              <div className="summary-card">
                <p className="label">{t("patientReports.summary.flexion")}</p>
                <h3>{flexionImprovement}°</h3>
                <span className="hint">
                  {t("patientReports.summary.hintImprovement")}
                </span>
              </div>

              <div className="summary-card">
                <p className="label">
                  {t("patientReports.summary.completion")}
                </p>
                <h3>{completionRate.toFixed(0)}%</h3>
                <span className="hint">
                  {t("patientReports.summary.hintCompletion")}
                </span>
              </div>
            </div>
          </div>

          {/* MAIN SECTION */}
          <div className="reports-main">
            {/* TABLE */}
            <section className="reports-table-card">
              <div className="card-header">
                <h2>{t("patientReports.table.title")}</h2>
                <p>{t("patientReports.table.subtitle")}</p>
              </div>

              <div className="table-wrapper">
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>{t("patientReports.table.headers.date")}</th>
                      <th>{t("patientReports.table.headers.pain")}</th>
                      <th>{t("patientReports.table.headers.flexion")}</th>
                      <th>{t("patientReports.table.headers.extension")}</th>
                      <th>{t("patientReports.table.headers.status")}</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredSessions.map((s) => (
                      <tr key={s.id}>
                        <td>{s.date}</td>

                        <td>
                          <span className="pain-emoji">
                            {painEmoji(s.painLevel)}
                          </span>
                          <span className="pain-number">{s.painLevel}</span>
                        </td>

                        <td>{s.flexion}°</td>
                        <td>{s.extension}°</td>

                        <td>
                          <span
                            className={`pill ${
                              s.completed
                                ? "pill-complete"
                                : "pill-pending"
                            }`}
                          >
                            {s.completed
                              ? t("patientReports.status.completed")
                              : t("patientReports.status.pending")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* MINI CHART */}
            <section className="reports-progress-card">
              <div className="card-header">
                <h2>{t("patientReports.chart.title")}</h2>
                <p>{t("patientReports.chart.subtitle")}</p>
              </div>

              <div className="progress-mini-chart">
                {sessions.map((s) => (
                  <div key={s.id} className="mini-column">
                    <div className="mini-bars">
                      <div
                        className="mini-bar flexion"
                        style={{ height: `${(s.flexion / 130) * 100}%` }}
                      />
                      <div
                        className="mini-bar pain"
                        style={{
                          height: `${(s.painLevel / 10) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="mini-label">
                      {new Date(s.date).getDate()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mini-legend">
                <span className="legend-item">
                  <span className="dot flexion" />{" "}
                  {t("patientReports.chart.legend.flexion")}
                </span>
                <span className="legend-item">
                  <span className="dot pain" />{" "}
                  {t("patientReports.chart.legend.pain")}
                </span>
              </div>
            </section>
          </div>
        </div>
      </div>

      <PatientBottomNav active="reports" />
    </>
  );
};

export default Reports;
