import { DEFAULT_CLINICIAN_ID } from "./patients";

/**
 * Seed medical file RECORDS ONLY — metadata, never an actual uploaded
 * blob (Section 31 of the brief: "If there is no actual upload backend,
 * keep demo documents explicitly demo-only and do not pretend
 * persistence exists"). `isDemoOnly: true` on every entry is what the
 * Clinical Record UI checks before rendering any open/download action —
 * these render as inert, clearly-labeled rows, never a fake working link.
 */

const dayOffset = (offset, referenceDate = new Date()) => {
  const date = new Date(referenceDate);
  date.setDate(date.getDate() + offset);
  return date;
};

export const buildInitialMedicalFiles = (referenceDate = new Date()) => [
  {
    id: "file-ahmed-1",
    patientId: "patient-ahmed",
    filename: "MRI_Scan.pdf",
    docTypeKey: "rehabDomain.fileTypes.imaging",
    uploadedAt: dayOffset(-70, referenceDate).toISOString(),
    uploadedBy: DEFAULT_CLINICIAN_ID,
    sizeLabel: "1.2 MB",
    isDemoOnly: true,
  },
  {
    id: "file-ahmed-2",
    patientId: "patient-ahmed",
    filename: "Initial_Assessment_Report.pdf",
    docTypeKey: "rehabDomain.fileTypes.assessment",
    uploadedAt: dayOffset(-63, referenceDate).toISOString(),
    uploadedBy: DEFAULT_CLINICIAN_ID,
    sizeLabel: "600 KB",
    isDemoOnly: true,
  },
];
