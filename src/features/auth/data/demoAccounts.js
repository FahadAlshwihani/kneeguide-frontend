/**
 * Public, intentionally-shared DEMO credentials for product preview —
 * NOT production secrets. Kept in one small presentation module (not
 * scattered as literal strings across DemoAccess.jsx/Login.jsx/
 * Register.jsx) so there is exactly one place to update them. Deliberately
 * has no relationship to real auth config: no env vars, no api/auth.js,
 * no AuthContext — these values only ever flow into Login's existing
 * controlled form state via a plain prop callback (see DemoAccess.jsx),
 * the same as if a user had typed them in by hand.
 */
export const DEMO_ACCOUNTS = {
  patient: {
    role: "patient",
    email: "patient@kneeguide.org",
    password: "Aa123123@",
  },
  doctor: {
    role: "doctor",
    email: "doctor@kneeguide.org",
    password: "Aa123123@",
  },
};
