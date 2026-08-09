import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaCircleCheck } from "react-icons/fa6";
import Reveal from "../../components/Reveal";
import { useSectionReveal } from "../../components/useSectionReveal";
import "./PatientDashboard.css";

const POINT_KEYS = ["checkIn", "checklist", "appointment"];
const EXERCISE_KEYS = ["heelSlides", "quadSets", "straightLegRaises"];

// Repeated values create the "hold" pauses described in the spec without
// separate pause-duration bookkeeping — advancing through this array on a
// fixed interval already reads as move-move-move-pause-pause-reset.
const RING_SEQUENCE = [3, 4, 5, 6, 6, 6, 3, 3];
const RING_STEP_MS = 1900; // 8 steps -> ~15.2s per full cycle (12-18s target)

const DONE_COUNT_SEQUENCE = [1, 2, 3, 3, 3, 1];
const CHECKLIST_STEP_MS = 2500; // 6 steps -> 15s per full cycle

// Maps a done-count to a translation key rather than translating a
// number directly — keeps the lookup a stable identifier independent of
// language, same reasoning as EXERCISE_KEYS/POINT_KEYS below.
const TIMESTAMP_KEY_BY_DONE_COUNT = { 1: "step1", 2: "step2", 3: "step3" };

const ICON_CONFIRM_MIN_MS = 4000;
const ICON_CONFIRM_MAX_MS = 9000;
const ICON_CONFIRM_DURATION_MS = 650;

const PatientDashboard = () => {
  const { t } = useTranslation();

  // This mock preview never unmounts while the user is anywhere on the
  // homepage, so its timers used to keep ticking — and re-rendering this
  // section — even while scrolled far past it (up in Hero, or down at
  // FAQ/CTA/Footer). Gating them on the section's own visibility (the same
  // pooled IntersectionObserver every other reveal on the page already
  // shares) pauses that work when nobody can see it and resumes it
  // naturally on scroll-back — the visual state (ringValue/doneCount)
  // isn't reset, only the recurring timers themselves restart.
  const { ref: sectionRef, isVisible } = useSectionReveal();

  const [ringStep, setRingStep] = useState(0);
  const [doneStep, setDoneStep] = useState(0);
  const [ringGlow, setRingGlow] = useState(false);
  const [pulseIndex, setPulseIndex] = useState(null);
  const [iconPulses, setIconPulses] = useState(() => POINT_KEYS.map(() => false));

  const ringValue = RING_SEQUENCE[ringStep];
  const doneCount = DONE_COUNT_SEQUENCE[doneStep];
  const timestamp = t(`publicPatientDashboard.mock.timestamps.${TIMESTAMP_KEY_BY_DONE_COUNT[doneCount]}`);
  const ringDeg = useMemo(() => `${(ringValue / 10) * 360}deg`, [ringValue]);

  const prevRingValue = useRef(ringValue);
  const prevDoneCount = useRef(doneCount);

  // Ring advance. Deliberately not language-dependent — this timer must
  // keep running across a language switch, not reset with it.
  useEffect(() => {
    if (!isVisible) return undefined;
    const id = setInterval(() => {
      setRingStep((step) => (step + 1) % RING_SEQUENCE.length);
    }, RING_STEP_MS);
    return () => clearInterval(id);
  }, [isVisible]);

  // Checklist advance — same reasoning as above.
  useEffect(() => {
    if (!isVisible) return undefined;
    const id = setInterval(() => {
      setDoneStep((step) => (step + 1) % DONE_COUNT_SEQUENCE.length);
    }, CHECKLIST_STEP_MS);
    return () => clearInterval(id);
  }, [isVisible]);

  // Soft glow around the ring whenever its value actually changes.
  useEffect(() => {
    if (prevRingValue.current === ringValue) return undefined;
    prevRingValue.current = ringValue;
    setRingGlow(true);
    const id = setTimeout(() => setRingGlow(false), 800);
    return () => clearTimeout(id);
  }, [ringValue]);

  // Checkbox scale-pulse on whichever exercise just became done.
  useEffect(() => {
    let id;
    if (doneCount > prevDoneCount.current) {
      const newlyDoneIndex = doneCount - 1;
      setPulseIndex(newlyDoneIndex);
      id = setTimeout(() => setPulseIndex(null), 450);
    }
    prevDoneCount.current = doneCount;
    return () => clearTimeout(id);
  }, [doneCount]);

  // Right-side check icons: each confirms on its own independent,
  // randomized schedule so the three never animate together. Keyed by
  // index/POINT_KEYS length, never by translated text, so it's also
  // unaffected by language.
  useEffect(() => {
    if (!isVisible) return undefined;

    const timeouts = POINT_KEYS.map(() => null);

    const schedule = (index) => {
      const delay = ICON_CONFIRM_MIN_MS + Math.random() * (ICON_CONFIRM_MAX_MS - ICON_CONFIRM_MIN_MS);
      timeouts[index] = setTimeout(() => {
        setIconPulses((prev) => prev.map((value, i) => (i === index ? true : value)));
        timeouts[index] = setTimeout(() => {
          setIconPulses((prev) => prev.map((value, i) => (i === index ? false : value)));
          schedule(index);
        }, ICON_CONFIRM_DURATION_MS);
      }, delay);
    };

    POINT_KEYS.forEach((_, index) => schedule(index));
    return () => timeouts.forEach((id) => clearTimeout(id));
  }, [isVisible]);

  return (
    <section className="patient-preview-root" id="patient-portal" ref={sectionRef}>
      <div className="patient-preview-container">
        {/* Decorative preview, not real data — its ring/checklist/time
            update on their own every couple of seconds, which would be a
            poor, noisy experience read aloud repeatedly by a screen
            reader. Nothing inside is focusable, so hiding the whole
            thing from the accessibility tree is safe. */}
        <Reveal as="div" className="patient-preview-mock" aria-hidden="true">
          <div className="patient-preview-mock-card">
            <div className="patient-preview-mock-header">
              <span className="patient-preview-mock-title">{t("publicPatientDashboard.mock.title")}</span>
              <span
                className={`patient-preview-mock-time${pulseIndex !== null ? " patient-preview-mock-time-update" : ""}`}
              >
                {timestamp}
              </span>
            </div>

            <div
              className={`patient-preview-mock-dial${ringGlow ? " patient-preview-mock-dial-glow" : ""}`}
              style={{ "--ring-deg": ringDeg }}
            >
              <div className="patient-preview-mock-dial-value">
                <span>{ringValue}</span>
                <small>{t("publicPatientDashboard.mock.ringUnit")}</small>
              </div>
            </div>

            <div className="patient-preview-mock-checklist">
              {EXERCISE_KEYS.map((key, index) => {
                const done = index < doneCount;
                const justActivated = pulseIndex === index;
                return (
                  <div
                    key={key}
                    className={[
                      "patient-preview-mock-item",
                      done ? "patient-preview-mock-item-done" : "",
                      justActivated ? "patient-preview-mock-item-activate" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <span
                      className={`patient-preview-mock-check${justActivated ? " patient-preview-mock-check-pulse" : ""}`}
                    />
                    <span>{t(`publicPatientDashboard.mock.exercises.${key}`)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="patient-preview-copy">
          <span className="patient-preview-badge">{t("publicPatientDashboard.badge")}</span>
          <h2 className="patient-preview-title">{t("publicPatientDashboard.title")}</h2>
          <p className="patient-preview-description">{t("publicPatientDashboard.description")}</p>
          <ul className="patient-preview-points">
            {POINT_KEYS.map((key, index) => (
              <li key={key}>
                <FaCircleCheck
                  aria-hidden="true"
                  className={iconPulses[index] ? "patient-preview-point-icon-pulse" : ""}
                />
                <span>{t(`publicPatientDashboard.points.${key}`)}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
};

export default PatientDashboard;
