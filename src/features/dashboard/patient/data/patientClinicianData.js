/**
 * Re-exports the canonical clinician identity from the shared rehab
 * domain (src/domain/rehab/demoData/clinicians.js) — moved there so the
 * Doctor side can read the exact same clinician record. Every existing
 * import of `DEFAULT_CLINICIAN` from this file keeps working unchanged.
 */
export { DEFAULT_CLINICIAN } from "../../../../domain/rehab/demoData/clinicians";
