/**
 * Re-exports the canonical exercise CATALOG from the shared rehab domain
 * (src/domain/rehab/demoData/exercises.js) — moved there so the Doctor's
 * exercise-assignment workflow reads from the SAME catalog instead of
 * inventing a second, doctor-only exercise list (Section 15 of the
 * brief). Every existing import of TODAY_EXERCISES/ADDITIONAL_EXERCISES/
 * ALL_EXERCISES from this file keeps working unchanged — this module's
 * public surface is unchanged, only its content's true home moved.
 */
export { TODAY_EXERCISES, ADDITIONAL_EXERCISES, ALL_EXERCISES, getExerciseById } from "../../../../domain/rehab/demoData/exercises";
