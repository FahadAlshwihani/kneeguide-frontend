// Single source of truth for Register's password rules — extracted from
// what was previously one inline regex inside Register.jsx's own
// validateStep (case 4): /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W).{8,}$/
//
// That regex requires, all at once: a lowercase letter, an uppercase
// letter, a digit, a non-word character (\W — anything that isn't a
// letter/digit/underscore), and a total length of at least 8. Rewritten
// here as four independent boolean checks + a length check, so BOTH the
// real validation gate (Register.jsx's validateStep, unchanged behavior)
// and the live checklist (PasswordChecklist.jsx) derive from the exact
// same rules — never two copies of the same requirement that could
// silently drift apart. The rules themselves are byte-for-byte identical
// to before; only the shape of the code expressing them changed, from one
// combined pattern to its individually-inspectable parts.
export const PASSWORD_MIN_LENGTH = 8;

export const getPasswordRequirements = (password) => ({
  minLength: password.length >= PASSWORD_MIN_LENGTH,
  uppercase: /[A-Z]/.test(password),
  lowercase: /[a-z]/.test(password),
  number: /\d/.test(password),
  special: /\W/.test(password),
});

export const isPasswordStrong = (password) =>
  Object.values(getPasswordRequirements(password)).every(Boolean);
