import { useMemo, useSyncExternalStore } from "react";
import * as repo from "./rehabRepository";
import {
  computeAdherence,
  derivePatientPriority,
  deriveLatestPain,
  derivePainTrend,
  deriveLatestRom,
  deriveRomTrend,
  deriveTrendDirection,
} from "./rehabDerived";

/**
 * React binding for the rehabRepository singleton (see that file for why
 * this is a plain module, not a Context). `useSyncExternalStore` is what
 * makes a Doctor Workspace tab re-render the instant a Patient-side
 * mutation happens in the same tab/session (and vice versa) — the
 * repository's `subscribe`/`getState` pair is the external store; React
 * re-renders any subscribed component whenever `notify()` fires.
 *
 * Every hook below calls this exactly ONCE per render and reuses the
 * returned reference as its `useMemo` dependency — calling
 * `useSyncExternalStore` a second time in the same render would register
 * a second store subscription for no benefit.
 */
const useRehabStoreVersion = () => useSyncExternalStore(repo.subscribe, repo.getState, repo.getState);

/**
 * Everything a Patient Workspace tab (or a Patient-side page) needs for
 * ONE patient, recomputed live whenever the shared store changes. Pure
 * derivation (adherence/priority/trends) happens here via rehabDerived.js
 * so no consumer re-implements this math.
 */
export const useRehabPatient = (patientId) => {
  const version = useRehabStoreVersion();

  return useMemo(() => {
    if (!patientId) return null;
    const patient = repo.getPatient(patientId);
    if (!patient) return null;

    const prescriptions = repo.getPrescriptions(patientId, { activeOnly: false });
    const activePrescriptions = prescriptions.filter((rx) => rx.status === "active");
    const sessions = repo.getSessions(patientId);
    const appointments = repo.getAppointments(patientId);
    const reports = repo.getReports(patientId);
    const clinicalNotes = repo.getClinicalNotes(patientId);
    const medicalFiles = repo.getMedicalFiles(patientId);
    const painLogs = repo.getPainLogs(patientId);

    const adherence = computeAdherence({ prescriptions: activePrescriptions, sessions });
    const priority = derivePatientPriority({ prescriptions: activePrescriptions, sessions, appointments, reports, painLogs });
    const latestPain = deriveLatestPain(painLogs);
    const painTrend = derivePainTrend(painLogs);
    const latestRom = deriveLatestRom(sessions);
    const romTrend = deriveRomTrend(sessions);
    const trendDirection = deriveTrendDirection(priority);

    return {
      patient,
      prescriptions,
      activePrescriptions,
      sessions,
      appointments,
      reports,
      clinicalNotes,
      medicalFiles,
      painLogs,
      adherence,
      priority,
      latestPain,
      painTrend,
      latestRom,
      romTrend,
      trendDirection,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, version]);
};

/** The Doctor Patients worklist needs every patient's summary at once. */
export const useRehabWorklist = () => {
  const version = useRehabStoreVersion();

  return useMemo(() => {
    const patients = repo.getPatients();
    return patients.map((patient) => {
      const prescriptions = repo.getPrescriptions(patient.id, { activeOnly: true });
      const sessions = repo.getSessions(patient.id);
      const appointments = repo.getAppointments(patient.id);
      const reports = repo.getReports(patient.id);
      const painLogs = repo.getPainLogs(patient.id);

      const adherence = computeAdherence({ prescriptions, sessions });
      const priority = derivePatientPriority({ prescriptions, sessions, appointments, reports, painLogs });
      const latestPain = deriveLatestPain(painLogs);
      const latestRom = deriveLatestRom(sessions);
      const latestSession = sessions[sessions.length - 1] || null;

      return { patient, adherence, priority, latestPain, latestRom, latestSession, appointments, reports };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);
};

export const useRehabAppointments = () => {
  const version = useRehabStoreVersion();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => repo.getAllAppointments(), [version]);
};

export { repo as rehabRepository };
