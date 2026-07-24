import React, { useState } from "react";
import { useParams } from "react-router-dom";
import DoctorLayout from "../components/layout/DoctorLayout";
import "../styles/DoctorReports.css";
import { useTranslation } from "react-i18next";

const mockReports = [
  {
    id: "RPT-3001",
    date: "2025-11-18",
    type: "Follow-up",
    painLevel: 4,
    status: "reviewed",
    severity: "medium",
    lastUpdated: "2025-11-18 09:12",
    notesPreview: "Patient shows improving flexion. Continue exercises.",
  },
  {
    id: "RPT-3000",
    date: "2025-11-12",
    type: "Initial Assessment",
    painLevel: 7,
    status: "pending",
    severity: "high",
    lastUpdated: "2025-11-12 14:22",
    notesPreview: "ACL tear suspected. MRI recommended.",
  },
];

const DoctorPatientReportsPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [reports] = useState(mockReports);
  const [selected, setSelected] = useState(null);

  return (
    <DoctorLayout active="patients">
      <div className="reports-page">
        <div className="reports-wrapper">

          {/* HEADER */}
          <div className="reports-header">
            <h1>{t("doctorReportsPage.title")}</h1>
            <p>
              {t("doctorReportsPage.subtitle")} {id}
            </p>
          </div>

          {/* SUMMARY */}
          <div className="reports-summary" style={{ marginTop: 20 }}>
            <div className="summary-card">
              <span className="label">{t("doctorReportsPage.summary.total")}</span>
              <h3>{reports.length}</h3>
            </div>
            <div className="summary-card">
              <span className="label">{t("doctorReportsPage.summary.reviewed")}</span>
              <h3>{reports.filter((r) => r.status === "reviewed").length}</h3>
            </div>
            <div className="summary-card">
              <span className="label">{t("doctorReportsPage.summary.pending")}</span>
              <h3>{reports.filter((r) => r.status === "pending").length}</h3>
            </div>
          </div>

          {/* TABLE */}
          <div className="reports-main">
            <div className="reports-table-card">
              <div className="card-header">
                <h2>{t("doctorReportsPage.table.title")}</h2>
                <p>{t("doctorReportsPage.table.subtitle")}</p>
              </div>

              <div className="table-wrapper">
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>{t("doctorReportsPage.table.headers.id")}</th>
                      <th>{t("doctorReportsPage.table.headers.date")}</th>
                      <th>{t("doctorReportsPage.table.headers.type")}</th>
                      <th>{t("doctorReportsPage.table.headers.pain")}</th>
                      <th>{t("doctorReportsPage.table.headers.status")}</th>
                      <th>{t("doctorReportsPage.table.headers.severity")}</th>
                      <th>{t("doctorReportsPage.table.headers.updated")}</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {reports.map((r) => (
                      <tr key={r.id}>
                        <td>{r.id}</td>
                        <td>{r.date}</td>
                        <td>{r.type}</td>

                        <td>
                          <span className="pill pill-pain">{r.painLevel}/10</span>
                        </td>

                        <td>
                          <span
                            className={`pill ${
                              r.status === "reviewed"
                                ? "pill-complete"
                                : "pill-pending"
                            }`}>
                            {t(`doctorReportsPage.status.${r.status}`)}
                          </span>
                        </td>

                        <td>
                          <span className={`pill pill-${r.severity}`}>
                            {t(`doctorReportsPage.severity.${r.severity}`)}
                          </span>
                        </td>

                        <td>{r.lastUpdated}</td>

                        <td>
                          <button
                            className="dr-view-btn"
                            onClick={() => setSelected(r)}
                          >
                            {t("doctorReportsPage.view")}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>

                </table>
              </div>
            </div>
          </div>

          {/* MODAL */}
          {selected && (
            <div
              className="dr-modal-backdrop"
              onClick={() => setSelected(null)}
            >
              <div
                className="dr-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <h2>
                  {t("doctorReportsPage.modal.report")} {selected.id}
                </h2>

                <p className="dr-muted" style={{ marginBottom: 10 }}>
                  {selected.type} — {selected.date}
                </p>

                <p>{selected.notesPreview}</p>

                <button
                  className="dr-ghost-btn"
                  onClick={() => setSelected(null)}
                  style={{ marginTop: 20 }}
                >
                  {t("doctorReportsPage.modal.close")}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </DoctorLayout>
  );
};

export default DoctorPatientReportsPage;
