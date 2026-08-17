import { ROLE_PATIENT, ROLE_DOCTOR, isPatient, isDoctor } from "./roles";

describe("roles", () => {
  test("isPatient returns true only for a patient user", () => {
    expect(isPatient({ role: ROLE_PATIENT })).toBe(true);
    expect(isPatient({ role: ROLE_DOCTOR })).toBe(false);
  });

  test("isDoctor returns true only for a doctor user", () => {
    expect(isDoctor({ role: ROLE_DOCTOR })).toBe(true);
    expect(isDoctor({ role: ROLE_PATIENT })).toBe(false);
  });

  test("both helpers are false for null/undefined users", () => {
    expect(isPatient(null)).toBe(false);
    expect(isPatient(undefined)).toBe(false);
    expect(isDoctor(null)).toBe(false);
    expect(isDoctor(undefined)).toBe(false);
  });

  test("both helpers are false for a user with an unrecognized role", () => {
    expect(isPatient({ role: "admin" })).toBe(false);
    expect(isDoctor({ role: "admin" })).toBe(false);
  });
});
