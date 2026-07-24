// src/pages/DoctorReports.jsx
import React, { useMemo, useState } from "react";
import DoctorLayout from "../components/layout/DoctorLayout";
import "../styles/DoctorReports.css";
import { useTranslation } from "react-i18next";

const initialReports = [
  {
    id: "RPT-1023",
    patientName: "Ahmed Ali",
    patientId: "PT-0001",
    date: "2025-11-18",
    type: "Follow-up",
    painLevel: 3,
    status: "reviewed",
    severity: "low",
    lastUpdated: "2025-11-18 09:12",
    notesPreview: "ROM improving, continue current exercises.",
  },
  {
    id: "RPT-1022",
    patientName: "Sara Almutairi",
    patientId: "PT-0002",
    date: "2025-11-16",
    type: "Initial assessment",
    painLevel: 7,
    status: "pending",
    severity: "high",
    lastUpdated: "2025-11-16 15:33",
    notesPreview: "Severe ACL injury, MRI requested.",
  },
  {
    id: "RPT-1021",
    patientName: "Fahad Alotaibi",
    patientId: "PT-0003",
    date: "2025-11-14",
    type: "Follow-up",
    painLevel: 5,
    status: "reviewed",
    severity: "medium",
    lastUpdated: "2025-11-14 11:04",
    notesPreview: "Moderate swelling, pain reduced since last visit.",
  },
  {
    id: "RPT-1019",
    patientName: "Ruba Salem",
    patientId: "PT-0004",
    date: "2025-11-10",
    type: "Progress check",
    painLevel: 2,
    status: "reviewed",
    severity: "low",
    lastUpdated: "2025-11-10 10:22",
    notesPreview: "Near full recovery, discharge in 2 weeks.",
  },
  {
    id: "RPT-1017",
    patientName: "Mohammed Aziz",
    patientId: "PT-0005",
    date: "2025-11-08",
    type: "Follow-up",
    painLevel: 8,
    status: "pending",
    severity: "high",
    lastUpdated: "2025-11-08 17:45",
    notesPreview: "Post-op day 3, high pain, adjust medication.",
  },
];

const DoctorReports = () => {
  const [reports, setReports] = useState(initialReports);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [selectedReport, setSelectedReport] = useState(null);

  const { t, i18n } = useTranslation();
  const isArabic = i18n.language && i18n.language.startsWith("ar");

  const filteredReports = useMemo(() => {
    let result = [...reports];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.patientName.toLowerCase().includes(q) ||
          r.patientId.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((r) => r.status === statusFilter);
    }

    if (severityFilter !== "all") {
      result = result.filter((r) => r.severity === severityFilter);
    }

    result.sort((a, b) => {
      if (sortKey === "date") {
        const da = new Date(a.date);
        const db = new Date(b.date);
        return sortDir === "asc" ? da - db : db - da;
      }
      if (sortKey === "painLevel") {
        return sortDir === "asc"
          ? a.painLevel - b.painLevel
          : b.painLevel - a.painLevel;
      }
      return 0;
    });

    return result;
  }, [reports, search, statusFilter, severityFilter, sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const handleMarkReviewed = () => {
    if (!selectedReport) return;
    setReports((prev) =>
      prev.map((r) =>
        r.id === selectedReport.id ? { ...r, status: "reviewed" } : r
      )
    );
    setSelectedReport((prev) =>
      prev ? { ...prev, status: "reviewed" } : prev
    );
  };

  const pendingCount = reports.filter((r) => r.status === "pending").length;

  return (
    <DoctorLayout active="reports">
      <div className="dr-page" dir={isArabic ? "rtl" : "ltr"}>
        {/* HEADER */}
        <div className="dr-header">
          <div>
            <h1>{t("doctorReports.header.title")}</h1>
            <p>{t("doctorReports.header.subtitle")}</p>
          </div>
          <div className="dr-header-meta">
            <span className="dr-pill">
              {t("doctorReports.meta.total", { count: reports.length })}
            </span>
            <span className="dr-pill dr-pill-soft">
              {t("doctorReports.meta.pending", { count: pendingCount })}
            </span>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="dr-filters">
          <div className="dr-search-box">
            <input
              type="text"
              placeholder={t("doctorReports.filters.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="dr-filter-group">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">
                {t("doctorReports.filters.statusAll")}
              </option>
              <option value="pending">
                {t("doctorReports.filters.statusPending")}
              </option>
              <option value="reviewed">
                {t("doctorReports.filters.statusReviewed")}
              </option>
            </select>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <option value="all">
                {t("doctorReports.filters.severityAll")}
              </option>
              <option value="low">
                {t("doctorReports.filters.severityLow")}
              </option>
              <option value="medium">
                {t("doctorReports.filters.severityMedium")}
              </option>
              <option value="high">
                {t("doctorReports.filters.severityHigh")}
              </option>
            </select>
          </div>
        </div>

        {/* TABLE */}
        <div className="doctor-report-table-wrapper">
          <table className="dr-table">
            <thead>
              <tr>
                <th>{t("doctorReports.table.columns.report")}</th>
                <th>{t("doctorReports.table.columns.patient")}</th>
                <th
                  className="sortable"
                  onClick={() => handleSort("date")}
                >
                  {t("doctorReports.table.columns.date")}
                  <span className="sort-indicator">
                    {sortKey === "date"
                      ? sortDir === "asc"
                        ? "▲"
                        : "▼"
                      : "⋯"}
                  </span>
                </th>
                <th>{t("doctorReports.table.columns.type")}</th>
                <th
                  className="sortable"
                  onClick={() => handleSort("painLevel")}
                >
                  {t("doctorReports.table.columns.pain")}
                  <span className="sort-indicator">
                    {sortKey === "painLevel"
                      ? sortDir === "asc"
                        ? "▲"
                        : "▼"
                      : "⋯"}
                  </span>
                </th>
                <th>{t("doctorReports.table.columns.status")}</th>
                <th>{t("doctorReports.table.columns.severity")}</th>
                <th>{t("doctorReports.table.columns.lastUpdated")}</th>
                <th>{t("doctorReports.table.columns.actions")}</th>
              </tr>
            </thead>

            <tbody>
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={9} className="dr-empty">
                    {t("doctorReports.table.noResults")}
                  </td>
                </tr>
              )}

              {filteredReports.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className="dr-main-cell">
                      <span className="dr-report-id">{r.id}</span>
                      <span className="dr-note-preview">
                        {r.notesPreview}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="dr-patient-cell">
                      <span className="dr-patient-name">
                        {r.patientName}
                      </span>
                      <span className="dr-patient-id">{r.patientId}</span>
                    </div>
                  </td>
                  <td>{r.date}</td>
                  <td>{r.type}</td>
                  <td>
                    <span className="dr-pain-pill">
                      {r.painLevel} / 10
                    </span>
                  </td>
                  <td>
                    <span
                      className={`dr-chip dr-chip-status-${r.status}`}
                    >
                      {r.status === "pending"
                        ? t("doctorReports.status.pendingShort")
                        : t("doctorReports.status.reviewedShort")}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`dr-chip dr-chip-severity-${r.severity}`}
                    >
                      {t(`doctorReports.severity.${r.severity}`)}
                    </span>
                  </td>
                  <td>{r.lastUpdated}</td>
                  <td>
                    <button
                      className="dr-view-btn"
                      onClick={() => setSelectedReport(r)}
                    >
                      {t("doctorReports.modal.actions.view", "View")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MODAL */}
        {selectedReport && (
          <div
            className="dr-modal-backdrop"
            onClick={() => setSelectedReport(null)}
          >
            <div
              className="dr-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="dr-modal-header">
                <div>
                  <h2>
                    {t("doctorReports.modal.titlePrefix")}{" "}
                    {selectedReport.id}
                  </h2>
                  <p>
                    {selectedReport.patientName} ·{" "}
                    <span className="dr-patient-id">
                      {selectedReport.patientId}
                    </span>
                  </p>
                </div>
                <button
                  className="dr-modal-close"
                  onClick={() => setSelectedReport(null)}
                >
                  ✕
                </button>
              </div>

              <div className="dr-modal-tags">
                <span
                  className={`dr-chip dr-chip-status-${selectedReport.status}`}
                >
                  {selectedReport.status === "pending"
                    ? t("doctorReports.status.pendingLong")
                    : t("doctorReports.status.reviewedLong")}
                </span>
                <span
                  className={`dr-chip dr-chip-severity-${selectedReport.severity}`}
                >
                  {t("doctorReports.severity.labelWithValue", {
                    value: t(
                      `doctorReports.severity.${selectedReport.severity}`
                    ),
                  })}
                </span>
                <span className="dr-chip dr-chip-soft">
                  {t("doctorReports.painPill", {
                    value: selectedReport.painLevel,
                  })}
                </span>
              </div>

              <div className="dr-modal-body">
                <div className="dr-modal-section">
                  <h3>{t("doctorReports.modal.summaryTitle")}</h3>
                  <p>
                    {selectedReport.notesPreview ||
                      t("doctorReports.modal.noSummary")}
                  </p>
                </div>

                <div className="dr-modal-grid">
                  <div className="dr-modal-section">
                    <h4>{t("doctorReports.modal.detailsTitle")}</h4>
                    <ul className="dr-details-list">
                      <li>
                        <span>
                          {
                            t(
                              "doctorReports.modal.details.date"
                            )
                          }
                        </span>
                        <span>{selectedReport.date}</span>
                      </li>
                      <li>
                        <span>
                          {
                            t(
                              "doctorReports.modal.details.type"
                            )
                          }
                        </span>
                        <span>{selectedReport.type}</span>
                      </li>
                      <li>
                        <span>
                          {
                            t(
                              "doctorReports.modal.details.painLevel"
                            )
                          }
                        </span>
                        <span>
                          {selectedReport.painLevel} / 10
                        </span>
                      </li>
                      <li>
                        <span>
                          {
                            t(
                              "doctorReports.modal.details.lastUpdated"
                            )
                          }
                        </span>
                        <span>{selectedReport.lastUpdated}</span>
                      </li>
                    </ul>
                  </div>

                  <div className="dr-modal-section">
                    <h4>{t("doctorReports.modal.doctorNotesTitle")}</h4>
                    <p className="dr-muted">
                      {t("doctorReports.modal.doctorNotesBody")}
                    </p>
                    <ul className="dr-bullet-list">
                      <li>
                        {
                          t(
                            "doctorReports.modal.doctorNotesBullets.trackRehab"
                          )
                        }
                      </li>
                      <li>
                        {
                          t(
                            "doctorReports.modal.doctorNotesBullets.comparePain"
                          )
                        }
                      </li>
                      <li>
                        {
                          t(
                            "doctorReports.modal.doctorNotesBullets.planNext"
                          )
                        }
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="dr-modal-footer">
                {selectedReport.status === "pending" && (
                  <button
                    className="dr-primary-btn"
                    onClick={handleMarkReviewed}
                  >
                    {t(
                      "doctorReports.modal.actions.markReviewed"
                    )}
                  </button>
                )}
                <button
                  className="dr-ghost-btn"
                  onClick={() => setSelectedReport(null)}
                >
                  {t("doctorReports.modal.actions.close")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DoctorLayout>
  );
};

export default DoctorReports;
