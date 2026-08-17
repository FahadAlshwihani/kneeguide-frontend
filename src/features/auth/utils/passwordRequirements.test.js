import {
  PASSWORD_MIN_LENGTH,
  getPasswordRequirements,
  isPasswordStrong,
} from "./passwordRequirements";

describe("getPasswordRequirements", () => {
  test("flags every rule as unmet for an empty password", () => {
    expect(getPasswordRequirements("")).toEqual({
      minLength: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false,
    });
  });

  test("flags every rule as met for a password satisfying all of them", () => {
    expect(getPasswordRequirements("Abcdef1!")).toEqual({
      minLength: true,
      uppercase: true,
      lowercase: true,
      number: true,
      special: true,
    });
  });

  test("flags only the rules that are actually satisfied", () => {
    // Long enough and lowercase, but no uppercase, digit, or special char.
    expect(getPasswordRequirements("abcdefgh")).toEqual({
      minLength: true,
      uppercase: false,
      lowercase: true,
      number: false,
      special: false,
    });
  });

  test("minLength uses PASSWORD_MIN_LENGTH as the boundary", () => {
    const short = "A1!".padEnd(PASSWORD_MIN_LENGTH - 1, "a");
    const exact = "A1!".padEnd(PASSWORD_MIN_LENGTH, "a");

    expect(getPasswordRequirements(short).minLength).toBe(false);
    expect(getPasswordRequirements(exact).minLength).toBe(true);
  });
});

describe("isPasswordStrong", () => {
  test("is true only when every requirement is met", () => {
    expect(isPasswordStrong("Abcdef1!")).toBe(true);
  });

  test("is false when any single requirement is missing", () => {
    expect(isPasswordStrong("abcdef1!")).toBe(false); // no uppercase
    expect(isPasswordStrong("ABCDEF1!")).toBe(false); // no lowercase
    expect(isPasswordStrong("Abcdefg!")).toBe(false); // no number
    expect(isPasswordStrong("Abcdefg1")).toBe(false); // no special char
    expect(isPasswordStrong("Ab1!")).toBe(false); // too short
  });
});
