import { useMemo, useSyncExternalStore } from "react";
import * as repo from "./rehabRepository";

/**
 * React binding for the rehabRepository singleton (see that file for why
 * this is a plain module, not a Context). `useSyncExternalStore` is what
 * makes a Doctor Workspace tab re-render the instant a Patient-side
 * mutation happens in the same tab/session (and vice versa) — the
 * repository's `subscribe`/`getState` pair is the external store; React
 * re-renders any subscribed component whenever `notify()` fires.
 *
 * Bundle CONSTRUCTION itself (adherence/priority/trends) lives once in
 * `rehabRepository.getPatientBundle`/`getWorklistBundles` — these hooks
 * only add the reactive subscription + memoization on top, so a non-React
 * caller (the Doctor Assistant insight engine, which runs outside any
 * component) can call the exact same builder and never get a second,
 * independently-derived copy of the same facts (Section 30).
 */
const useRehabStoreVersion = () => useSyncExternalStore(repo.subscribe, repo.getState, repo.getState);

/** Everything a Patient Workspace tab (or a Patient-side page) needs for ONE patient, recomputed live whenever the shared store changes. */
export const useRehabPatient = (patientId) => {
  const version = useRehabStoreVersion();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => (patientId ? repo.getPatientBundle(patientId) : null), [patientId, version]);
};

/** The Doctor Patients worklist needs every patient's summary bundle at once. */
export const useRehabWorklist = () => {
  const version = useRehabStoreVersion();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => repo.getWorklistBundles(), [version]);
};

export const useRehabAppointments = () => {
  const version = useRehabStoreVersion();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => repo.getAllAppointments(), [version]);
};

/** The canonical doctor profile (Doctor Profile brief) — reactive, so Topbar/AccountMenu/Profile/Appointments never disagree. */
export const useDoctorProfile = () => {
  const version = useRehabStoreVersion();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => repo.getDoctorProfile(), [version]);
};

export { repo as rehabRepository };
