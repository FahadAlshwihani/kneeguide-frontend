import { DOCTOR_ASSISTANT_ACTIONS } from "./doctorAssistantActions";
import { ROUTES } from "../../../../utils/routes";

/**
 * Route-aware suggestion selection for the Assistant Drawer (Section 12) —
 * a clean, extensible MAPPING onto the EXISTING action registry
 * (doctorAssistantActions.js), never a second set of clinical actions.
 * Home is the only route with real distinct behavior right now; every
 * other route intentionally reuses the same 5 actions in the same order
 * rather than fabricating page-specific capabilities that don't exist yet
 * (Section 12's own "do not fabricate deep page-specific functionality").
 * Extending this later (e.g. a genuinely different Patients-context
 * suggestion set once that page grows real per-patient actions) means
 * adding one more entry here — nothing else needs to change.
 */
const ROUTE_SUGGESTION_IDS = {
  [ROUTES.DOCTOR_DASHBOARD]: ["DOCTOR_ATTENTION_PATIENTS", "DOCTOR_REPORT_SUMMARY", "DOCTOR_TODAY_APPOINTMENTS", "DOCTOR_PATIENT_PROGRESS"],
  [ROUTES.DOCTOR_PATIENTS]: ["DOCTOR_ATTENTION_PATIENTS", "DOCTOR_ADHERENCE_RISK", "DOCTOR_PATIENT_PROGRESS"],
  [ROUTES.APPOINTMENTS]: ["PENDING_APPOINTMENT_REQUESTS", "DOCTOR_TODAY_APPOINTMENTS", "SCHEDULE_APPOINTMENT", "CHECK_SCHEDULE_CONFLICTS"],
  [ROUTES.DOCTOR_REPORTS]: ["DOCTOR_REPORT_SUMMARY", "WHO_IMPROVED", "WHO_REGRESSED", "HIGHEST_PRIORITY_REPORT"],
  [ROUTES.DOCTOR_PROFILE]: ["DOCTOR_ATTENTION_PATIENTS", "DOCTOR_TODAY_APPOINTMENTS"],
};

const DEFAULT_SUGGESTION_IDS = DOCTOR_ASSISTANT_ACTIONS.map((action) => action.id);

/** Up to `limit` action objects for the given pathname — falls back to the full registry (in its default order) for any route not mapped above. */
export const getContextualSuggestions = (pathname, limit = 4) => {
  const ids = ROUTE_SUGGESTION_IDS[pathname] || DEFAULT_SUGGESTION_IDS;
  return ids
    .map((id) => DOCTOR_ASSISTANT_ACTIONS.find((action) => action.id === id))
    .filter(Boolean)
    .slice(0, limit);
};
