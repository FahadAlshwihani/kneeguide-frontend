/**
 * The ONE source of truth for the patient's exercise program mock data —
 * so it can be read by the KneeGuide Assistant's SHOW_EXERCISES action
 * (patientAssistantActions.js) and the Exercise Details modal
 * (components/exercises/ExerciseDetailsModal.jsx) without either
 * duplicating these objects or inventing a second exercise list.
 *
 * This is the EXERCISE DEFINITION layer — "what is this exercise, how is
 * it performed" — as distinct from the REHAB PRESCRIPTION layer
 * (data/patientRehabPlanData.js: sets/reps/target ROM/estimated duration
 * for TODAY specifically). `targetKey` below is the exercise's own
 * intrinsic focus/category (e.g. "Knee extension control") and lives
 * here, not in the plan — it doesn't change per day. `instructionsKey`/
 * `cuesKey`/`mistakesKey` are the canonical source for Exercise Details —
 * that modal is the ONLY place this content is authored; nothing
 * duplicates these paragraphs elsewhere.
 *
 * Names/descriptions/instructions stay as i18next KEYS here, not
 * resolved strings — this module has no React/i18n dependency itself.
 * Each consumer resolves them with its own `t()`: PatientExercises.jsx
 * uses the active UI language (unchanged behavior); the Assistant uses a
 * fixed conversation language via `t(key, { lng })` (see
 * patientAssistantLanguage.js) — exactly the same "existing translated
 * display name, different language parameter" pattern already used for
 * every other Assistant response. `instructionsKey`/`cuesKey`/
 * `mistakesKey` resolve to STRING ARRAYS via i18next's own
 * `returnObjects: true` option — the standard i18next mechanism for a
 * translated list, not a bespoke array format.
 *
 * `lastDoneKey`/`progress` (catalog-card-only fields from the old
 * image-card Exercise Library) were removed — the Library is now a
 * compact reference list that doesn't show either, and nothing else in
 * the app ever read them (confirmed before removing).
 */

export const TODAY_EXERCISES = [
  {
    id: "quadSets",
    nameKey: "patientExercises.mock.quadSets.name",
    reps: "3 × 12",
    image: "https://twnlivestorage1.blob.core.windows.net/twn-media-public/KRM63451A/332192.jpg",
    video: "https://www.youtube.com/watch?v=5TUK4uT2nnw",
    descriptionKey: "patientExercises.mock.quadSets.description",
    targetKey: "patientExercises.mock.quadSets.target",
    instructionsKey: "patientExercises.mock.quadSets.instructions",
    cuesKey: "patientExercises.mock.quadSets.cues",
    mistakesKey: "patientExercises.mock.quadSets.mistakes",
  },
  {
    id: "legRaises",
    nameKey: "patientExercises.mock.legRaises.name",
    reps: "3 × 10",
    image: "https://twnlivestorage1.blob.core.windows.net/twn-media-public/KRM65842A/357653.jpg",
    video: "https://www.youtube.com/watch?v=gobteD5GWkE",
    descriptionKey: "patientExercises.mock.legRaises.description",
    targetKey: "patientExercises.mock.legRaises.target",
    instructionsKey: "patientExercises.mock.legRaises.instructions",
    cuesKey: "patientExercises.mock.legRaises.cues",
    mistakesKey: "patientExercises.mock.legRaises.mistakes",
  },
  {
    id: "heelSlides",
    nameKey: "patientExercises.mock.heelSlides.name",
    reps: "3 × 15",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQWc8NT1BKuYOP8r-UvfTw92P1US480dT5gBw&s",
    video: "https://www.youtube.com/watch?v=A7fcobCVppc",
    descriptionKey: "patientExercises.mock.heelSlides.description",
    targetKey: "patientExercises.mock.heelSlides.target",
    instructionsKey: "patientExercises.mock.heelSlides.instructions",
    cuesKey: "patientExercises.mock.heelSlides.cues",
    mistakesKey: "patientExercises.mock.heelSlides.mistakes",
  },
];

// Additional exercises shown only under the Exercise Library — never
// part of "today's" list, unchanged from before.
export const ADDITIONAL_EXERCISES = [
  {
    id: "hamstring",
    nameKey: "patientExercises.mock.hamstring.name",
    reps: "2 × 30 sec",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT_giL-IUoN0K8-EHtvcebyA7xRdNdSXtK-HQ&s",
    video: "https://www.youtube.com/watch?v=me22JRV7pJc",
    descriptionKey: "patientExercises.mock.hamstring.description",
    targetKey: "patientExercises.mock.hamstring.target",
    instructionsKey: "patientExercises.mock.hamstring.instructions",
    cuesKey: "patientExercises.mock.hamstring.cues",
    mistakesKey: "patientExercises.mock.hamstring.mistakes",
  },
  {
    id: "calfRaises",
    nameKey: "patientExercises.mock.calfRaises.name",
    reps: "3 × 15",
    image: "https://gymgeek.com/wp-content/uploads/2023/10/raised-step-calf-raises-1.png",
    video: "https://www.youtube.com/watch?v=BxfKOyI8sUg",
    descriptionKey: "patientExercises.mock.calfRaises.description",
    targetKey: "patientExercises.mock.calfRaises.target",
    instructionsKey: "patientExercises.mock.calfRaises.instructions",
    cuesKey: "patientExercises.mock.calfRaises.cues",
    mistakesKey: "patientExercises.mock.calfRaises.mistakes",
  },
];

export const ALL_EXERCISES = [...TODAY_EXERCISES, ...ADDITIONAL_EXERCISES];
