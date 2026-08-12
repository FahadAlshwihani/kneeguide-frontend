import { DEFAULT_CLINICIAN } from "./clinicians";
import { DOCTOR_AVAILABILITY_STATUS } from "../rehabEnums";

/**
 * THE canonical, EDITABLE doctor profile (Doctor Profile brief) — the
 * single source of truth for the Doctor Workspace's own identity (Profile
 * page, Topbar avatar, account menu) and for appointment availability.
 * `id` is anchored to `DEFAULT_CLINICIAN.id` ("dr-sarah-ahmed") — the same
 * stable identifier every canonical appointment already stores as
 * `clinicianId` — so this profile is additive to, not a replacement of,
 * the existing clinician anchor. `specialty` is a plain editable string
 * here (not `DEFAULT_CLINICIAN.specialtyKey`, a translation key used for
 * the separate, already-stable Patient-facing "your clinician" display) —
 * deliberately kept distinct rather than conflating a translated i18n key
 * with doctor-entered free text.
 */
export const buildInitialDoctorProfile = () => ({
  id: DEFAULT_CLINICIAN.id,
  name: "Dr. Sarah Ahmed",
  specialty: "Orthopedic Surgeon — Knee & Sports Injuries",
  yearsExperience: 12,
  licenseNumber: "MOH-4589321",
  clinicName: "KneeGuide Specialized Clinic",
  email: "sarah.ahmed@kneeguide.com",
  phone: "+966 55 123 4567",
  location: "Riyadh, Saudi Arabia",
  bio: "Specialized in ACL reconstruction, meniscus injuries, and post-operative rehabilitation with a focus on evidence-based protocols.",
  avatarDataUrl: null,
  availabilityStatus: DOCTOR_AVAILABILITY_STATUS.AVAILABLE,
  workingHours: {
    sunday: { enabled: true, start: "14:00", end: "20:00" },
    monday: { enabled: true, start: "14:00", end: "20:00" },
    tuesday: { enabled: true, start: "14:00", end: "20:00" },
    wednesday: { enabled: true, start: "14:00", end: "20:00" },
    thursday: { enabled: true, start: "15:00", end: "19:00" },
    friday: { enabled: false, start: "14:00", end: "20:00" },
    saturday: { enabled: false, start: "14:00", end: "20:00" },
  },
});
