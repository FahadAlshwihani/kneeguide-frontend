/**
 * THE canonical exercise CATALOG — "what is this exercise, how is it
 * performed" — moved here unchanged from the patient feature's
 * data/patientExercisesData.js (that file now re-exports these same
 * arrays so every existing patient-side import — the Assistant's
 * SHOW_EXERCISES action, the Exercise Details modal, the Exercise
 * Library — keeps working untouched).
 *
 * This is also now the ONE catalog the Doctor's prescription workflow
 * (assign/edit rehabilitation plan) picks from — never a second,
 * doctor-only exercise list (the brief's Section 15 requirement).
 *
 * `mode` (added for this refactor) records whether an exercise is
 * naturally reps-based or duration/hold-based (Section 16) — used by the
 * prescription model in rehabPlans.js and by the assignment UI to decide
 * which fields to show. Existing fields (id/nameKey/reps/image/video/
 * descriptionKey/targetKey/instructionsKey/cuesKey/mistakesKey) are
 * untouched.
 */

import { EXERCISE_MODE } from "../rehabEnums";

export const TODAY_EXERCISES = [
  {
    id: "quadSets",
    mode: EXERCISE_MODE.REPS,
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
    mode: EXERCISE_MODE.REPS,
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
    mode: EXERCISE_MODE.REPS,
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

export const ADDITIONAL_EXERCISES = [
  {
    id: "hamstring",
    mode: EXERCISE_MODE.DURATION,
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
    mode: EXERCISE_MODE.REPS,
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

export const getExerciseById = (id) => ALL_EXERCISES.find((exercise) => exercise.id === id) || null;
