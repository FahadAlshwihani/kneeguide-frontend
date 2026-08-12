import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuLock, LuFileText } from "react-icons/lu";
import { rehabRepository } from "../../../../../domain/rehab/useRehabDomain";
import { NOTE_VISIBILITY, APPOINTMENT_STATUS } from "../../../../../domain/rehab/rehabEnums";
import { DEFAULT_CLINICIAN_ID } from "../../../../../domain/rehab/demoData/patients";
import "./ClinicalRecordTab.css";

/**
 * Clinical Record tab (Section 30-33) — three coherent subsections
 * instead of the pre-refactor's disconnected Notes/Files/Visit-History
 * cards. Notes default to CLINICIAN_ONLY (never silently exposed to the
 * Patient UI). Visit history is derived from COMPLETED appointments only
 * — a home rehab session is explicitly NOT a "visit" (Section 32). Files
 * are demo-metadata only; every row is clearly non-functional (Section
 * 31 — no fake download action).
 */
const ClinicalRecordTab = ({ bundle }) => {
  const { t, i18n } = useTranslation();
  const { patient, clinicalNotes, medicalFiles, appointments } = bundle;
  const [noteContent, setNoteContent] = useState("");
  const [noteError, setNoteError] = useState(null);

  const dateFormatter = new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium" });
  const visits = appointments
    .filter((appt) => appt.status === APPOINTMENT_STATUS.COMPLETED)
    .sort((a, b) => new Date(b.startAt) - new Date(a.startAt));

  const handleAddNote = () => {
    const trimmed = noteContent.trim();
    if (!trimmed) {
      setNoteError(t("doctorPatientWorkspace.clinicalRecord.errors.emptyNote"));
      return;
    }
    rehabRepository.addClinicalNote(patient.id, {
      authorId: DEFAULT_CLINICIAN_ID,
      content: trimmed,
      visibility: NOTE_VISIBILITY.CLINICIAN_ONLY,
    });
    setNoteContent("");
    setNoteError(null);
  };

  const noteText = (note) => (note.content.startsWith("rehabDomain.") ? t(note.content) : note.content);

  return (
    <div>
      <section className="dw-section">
        <h2>{t("doctorPatientWorkspace.clinicalRecord.notes")}</h2>

        <div className="cr-add-note">
          <div className="dw-field">
            <label htmlFor="cr-note">{t("doctorPatientWorkspace.clinicalRecord.addNote")}</label>
            <textarea id="cr-note" rows={3} value={noteContent} onChange={(event) => setNoteContent(event.target.value)} />
          </div>
          {noteError && <p className="dw-field-error">{noteError}</p>}
          <button type="button" className="dw-btn-primary" onClick={handleAddNote}>
            {t("doctorPatientWorkspace.clinicalRecord.saveNote")}
          </button>
        </div>

        {clinicalNotes.length === 0 ? (
          <p className="dw-empty-state">{t("doctorPatientWorkspace.clinicalRecord.noNotes")}</p>
        ) : (
          <ul className="cr-note-list">
            {clinicalNotes.map((note) => (
              <li key={note.id} className="cr-note">
                <div className="cr-note-head">
                  <span className="cr-note-type">{t(note.typeKey)}</span>
                  {note.visibility === NOTE_VISIBILITY.CLINICIAN_ONLY && (
                    <span className="cr-note-visibility">
                      <LuLock aria-hidden="true" /> {t("doctorPatientWorkspace.clinicalRecord.clinicianOnly")}
                    </span>
                  )}
                  <span className="cr-note-date">{dateFormatter.format(new Date(note.createdAt))}</span>
                </div>
                <p className="cr-note-content">{noteText(note)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="dw-section">
        <h2>{t("doctorPatientWorkspace.clinicalRecord.files")}</h2>
        {medicalFiles.length === 0 ? (
          <p className="dw-empty-state">{t("doctorPatientWorkspace.clinicalRecord.noFiles")}</p>
        ) : (
          <ul className="cr-file-list">
            {medicalFiles.map((file) => (
              <li key={file.id} className="cr-file">
                <LuFileText aria-hidden="true" />
                <div className="cr-file-info">
                  <span className="cr-file-name">{file.filename}</span>
                  <span className="cr-file-meta">
                    {t(file.docTypeKey)} · {file.sizeLabel} · {dateFormatter.format(new Date(file.uploadedAt))}
                  </span>
                </div>
                <span className="cr-file-demo-tag">{t("doctorPatientWorkspace.clinicalRecord.demoOnly")}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="dw-section">
        <h2>{t("doctorPatientWorkspace.clinicalRecord.visitHistory")}</h2>
        {visits.length === 0 ? (
          <p className="dw-empty-state">{t("doctorPatientWorkspace.clinicalRecord.noVisits")}</p>
        ) : (
          <table className="cr-visit-table">
            <thead>
              <tr>
                <th>{t("doctorPatientWorkspace.clinicalRecord.visitTable.date")}</th>
                <th>{t("doctorPatientWorkspace.clinicalRecord.visitTable.type")}</th>
                <th>{t("doctorPatientWorkspace.clinicalRecord.visitTable.status")}</th>
              </tr>
            </thead>
            <tbody>
              {visits.map((visit) => (
                <tr key={visit.id}>
                  <td>{dateFormatter.format(new Date(visit.startAt))}</td>
                  <td>{t(visit.typeKey)}</td>
                  <td>
                    <span className="cr-visit-status">{t("doctorPatientWorkspace.appointments.status.completed")}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default ClinicalRecordTab;
