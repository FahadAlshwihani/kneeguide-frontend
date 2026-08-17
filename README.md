# KneeGuide Frontend

KneeGuide is a knee-rehabilitation telehealth web app: a marketing/public site plus separate patient and doctor dashboards for exercise plans, appointments, session tracking, and recovery reports. Built with [Create React App](https://github.com/facebook/create-react-app) (react-scripts 5) and React 19.

## Getting started

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000). The page reloads on changes; lint errors show in the console.

## Environment configuration

The app reads its backend base URL from `REACT_APP_API_BASE_URL` (see `src/api/axios.js`):

- `.env.development` — local backend (`http://127.0.0.1:8000/api/`)
- `.env.production` — deployed backend, used by `npm run build`

Override either with a `.env.local`/`.env.development.local` file (already gitignored) instead of editing the committed `.env.*` files directly.

## Available scripts

### `npm start`

Runs the app in development mode.

### `npm test`

Runs the Jest test suite once with `--watchAll=false`-style CI behavior when `CI=true`, or in interactive watch mode otherwise.

### `npm run build`

Builds a production bundle to `build/`, minified with content-hashed filenames.

### `npm run eject`

One-way: copies the CRA build config (webpack, Babel, ESLint) into the project for full control. Not needed for normal development.

## Project structure

```
src/
  api/                 axios client + REST calls (auth, reports, exercises, appointments)
  app/                 App root + top-level route composition
  components/          shared UI primitives (buttons, popovers, dock, stepper, three.js viewer)
  context/              AuthContext (session/auth state)
  domain/rehab/         demo-data-backed rehab domain layer (patients, plans, sessions, reports)
  features/
    auth/                Login, Register, OTP verification
    dashboard/doctor/     doctor-facing dashboard, patient workspace, clinical assistant
    dashboard/patient/    patient-facing dashboard, exercises, appointments, reports, profile
    public/               marketing site (home, about, features, how-it-works, technology, contact)
  layouts/               route-level layout shells (public, auth, patient/doctor dashboard)
  routes/                react-router route definitions
  utils/                 small cross-cutting helpers (roles, storage, direction/RTL)
```

## Internationalization

UI copy is bilingual (English/Arabic) via `i18next` + `react-i18next`. Translation bundles live in `public/translations/{en,ar}.json` and are fetched at runtime (`src/i18n.js`); both languages are always preloaded so language-specific lookups work regardless of the active UI language. RTL/LTR document direction is applied automatically on language change (`src/utils/dir.js`).

## Testing

Tests live alongside the code they cover (`*.test.js`). Run them with `npm test`. Components that transitively pull in the app's ESM-only dependencies (react-router-dom, three.js/ogl, motion) aren't covered by unit tests under this project's Jest 27 toolchain without deeper Jest config changes — current coverage focuses on pure utility/logic modules (`src/utils/`, `src/features/auth/utils/`).

## Learn more

- [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started)
- [React documentation](https://reactjs.org/)
