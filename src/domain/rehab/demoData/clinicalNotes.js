import { NOTE_AUTHOR_ROLE, NOTE_VISIBILITY } from "../rehabEnums";
import { DEFAULT_CLINICIAN_ID } from "./patients";

/**
 * Seed clinical notes — clinician-authored, `CLINICIAN_ONLY` by default
 * (Section 33 of the brief: "Default clinical note: clinician-only unless
 * the existing product says otherwise... do not accidentally expose
 * private clinician notes in Patient UI"). Content is reconciled from the
 * pre-refactor DoctorPatientProfile.jsx static `notes` array, now
 * attributed to the real clinician id and keyed by `patientId`.
 */

const dayOffset = (offset, referenceDate = new Date()) => {
  const date = new Date(referenceDate);
  date.setHours(9, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
};

export const buildInitialClinicalNotes = (referenceDate = new Date()) => [
  {
    id: "note-ahmed-2",
    patientId: "patient-ahmed",
    authorId: DEFAULT_CLINICIAN_ID,
    authorRole: NOTE_AUTHOR_ROLE.DOCTOR,
    typeKey: "rehabDomain.noteTypes.sessionProgress",
    content: "rehabDomain.notes.ahmedSessionProgress",
    createdAt: dayOffset(-1, referenceDate).toISOString(),
    visibility: NOTE_VISIBILITY.CLINICIAN_ONLY,
    sessionId: "sess-ahmed-5",
    reportId: null,
  },
  {
    id: "note-ahmed-1",
    patientId: "patient-ahmed",
    authorId: DEFAULT_CLINICIAN_ID,
    authorRole: NOTE_AUTHOR_ROLE.DOCTOR,
    typeKey: "rehabDomain.noteTypes.initialAssessment",
    content: "rehabDomain.notes.ahmedInitialAssessment",
    createdAt: dayOffset(-60, referenceDate).toISOString(),
    visibility: NOTE_VISIBILITY.CLINICIAN_ONLY,
    sessionId: null,
    reportId: null,
  },
];
