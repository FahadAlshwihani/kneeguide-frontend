/**
 * The ONE source of truth for the patient's exercise program mock data —
 * extracted verbatim from PatientExercises.jsx (its previous sole owner)
 * so it can also be read by the KneeGuide Assistant's SHOW_EXERCISES
 * action (patientAssistantActions.js) without either duplicating these
 * objects or inventing a second exercise list. Values (reps, progress,
 * image/video URLs) are unchanged from before this extraction.
 *
 * Names/descriptions/"last done" strings stay as i18next KEYS here, not
 * resolved strings — this module has no React/i18n dependency itself.
 * Each consumer resolves them with its own `t()`: PatientExercises.jsx
 * uses the active UI language (unchanged behavior); the Assistant uses a
 * fixed conversation language via `t(key, { lng })` (see
 * patientAssistantLanguage.js) — exactly the same "existing translated
 * display name, different language parameter" pattern already used for
 * every other Assistant response.
 */

export const TODAY_EXERCISES = [
  {
    id: "quadSets",
    nameKey: "patientExercises.mock.quadSets.name",
    reps: "3 × 12",
    lastDoneKey: "patientExercises.mock.quadSets.lastDone",
    progress: 80,
    image: "https://twnlivestorage1.blob.core.windows.net/twn-media-public/KRM63451A/332192.jpg",
    video: "https://www.youtube.com/watch?v=5TUK4uT2nnw",
    descriptionKey: "patientExercises.mock.quadSets.description",
  },
  {
    id: "legRaises",
    nameKey: "patientExercises.mock.legRaises.name",
    reps: "3 × 10",
    lastDoneKey: "patientExercises.mock.legRaises.lastDone",
    progress: 60,
    image: "https://twnlivestorage1.blob.core.windows.net/twn-media-public/KRM65842A/357653.jpg",
    video: "https://www.youtube.com/watch?v=gobteD5GWkE",
    descriptionKey: "patientExercises.mock.legRaises.description",
  },
  {
    id: "heelSlides",
    nameKey: "patientExercises.mock.heelSlides.name",
    reps: "3 × 15",
    lastDoneKey: "patientExercises.mock.heelSlides.lastDone",
    progress: 40,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQWc8NT1BKuYOP8r-UvfTw92P1US480dT5gBw&s",
    video: "https://www.youtube.com/watch?v=A7fcobCVppc",
    descriptionKey: "patientExercises.mock.heelSlides.description",
  },
];

// Additional exercises shown only under the Exercises page's "All
// Exercises" tab — never part of "today's" list, unchanged from before.
export const ADDITIONAL_EXERCISES = [
  {
    id: "hamstring",
    nameKey: "patientExercises.mock.hamstring.name",
    reps: "2 × 30 sec",
    lastDoneKey: "patientExercises.mock.hamstring.lastDone",
    progress: 20,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT_giL-IUoN0K8-EHtvcebyA7xRdNdSXtK-HQ&s",
    video: "https://www.youtube.com/watch?v=me22JRV7pJc",
    descriptionKey: "patientExercises.mock.hamstring.description",
  },
  {
    id: "calfRaises",
    nameKey: "patientExercises.mock.calfRaises.name",
    reps: "3 × 15",
    lastDoneKey: "patientExercises.mock.calfRaises.lastDone",
    progress: 10,
    image: "https://gymgeek.com/wp-content/uploads/2023/10/raised-step-calf-raises-1.png",
    video: "https://www.youtube.com/watch?v=BxfKOyI8sUg",
    descriptionKey: "patientExercises.mock.calfRaises.description",
  },
];

export const ALL_EXERCISES = [...TODAY_EXERCISES, ...ADDITIONAL_EXERCISES];
