import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaCircleCheck } from "react-icons/fa6";
import Reveal from "../../components/Reveal";
import "./PatientDashboard.css";

const POINTS = [
  "A one-tap pain wheel check-in each day",
  "A clear checklist of today's exercises",
  "Your next appointment, always one tap away",
];

const EXERCISES = ["Heel slides", "Quad sets", "Straight leg raises"];

// Repeated values create the "hold" pauses described in the spec without
// separate pause-duration bookkeeping — advancing through this array on a
// fixed interval already reads as move-move-move-pause-pause-reset.
const RING_SEQUENCE = [3, 4, 5, 6, 6, 6, 3, 3];
const RING_STEP_MS = 1900; // 8 steps -> ~15.2s per full cycle (12-18s target)

const DONE_COUNT_SEQUENCE = [1, 2, 3, 3, 3, 1];
const CHECKLIST_STEP_MS = 2500; // 6 steps -> 15s per full cycle

const TIMESTAMPS_BY_DONE_COUNT = { 1: "7:42 AM", 2: "7:45 AM", 3: "7:48 AM" };

const ICON_CONFIRM_MIN_MS = 4000;
const ICON_CONFIRM_MAX_MS = 9000;
const ICON_CONFIRM_DURATION_MS = 650;

const PatientDashboard = () => {
  const [ringStep, setRingStep] = useState(0);
  const [doneStep, setDoneStep] = useState(0);
  const [ringGlow, setRingGlow] = useState(false);
  const [pulseIndex, setPulseIndex] = useState(null);
  const [iconPulses, setIconPulses] = useState(() => POINTS.map(() => false));

  const ringValue = RING_SEQUENCE[ringStep];
  const doneCount = DONE_COUNT_SEQUENCE[doneStep];
  const timestamp = TIMESTAMPS_BY_DONE_COUNT[doneCount];
  const ringDeg = useMemo(() => `${(ringValue / 10) * 360}deg`, [ringValue]);

  const prevRingValue = useRef(ringValue);
  const prevDoneCount = useRef(doneCount);

  // Ring advance.
  useEffect(() => {
    const id = setInterval(() => {
      setRingStep((step) => (step + 1) % RING_SEQUENCE.length);
    }, RING_STEP_MS);
    return () => clearInterval(id);
  }, []);

  // Checklist advance.
  useEffect(() => {
    const id = setInterval(() => {
      setDoneStep((step) => (step + 1) % DONE_COUNT_SEQUENCE.length);
    }, CHECKLIST_STEP_MS);
    return () => clearInterval(id);
  }, []);

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
  // randomized schedule so the three never animate together.
  useEffect(() => {
    const timeouts = POINTS.map(() => null);

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

    POINTS.forEach((_, index) => schedule(index));
    return () => timeouts.forEach((id) => clearTimeout(id));
  }, []);

  return (
    <section className="patient-preview-root" id="patient-portal">
      <div className="patient-preview-container">
        <Reveal as="div" className="patient-preview-mock">
          <div className="patient-preview-mock-card">
            <div className="patient-preview-mock-header">
              <span className="patient-preview-mock-title">Today&apos;s check-in</span>
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
                <small>/ 10</small>
              </div>
            </div>

            <div className="patient-preview-mock-checklist">
              {EXERCISES.map((label, index) => {
                const done = index < doneCount;
                const justActivated = pulseIndex === index;
                return (
                  <div
                    key={label}
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
                    <span>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="patient-preview-copy">
          <span className="patient-preview-badge">For Patients</span>
          <h2 className="patient-preview-title">Recovery you can actually see.</h2>
          <p className="patient-preview-description">
            Log how you feel, follow your exercises, and watch your progress
            add up — all from your phone.
          </p>
          <ul className="patient-preview-points">
            {POINTS.map((point, index) => (
              <li key={point}>
                <FaCircleCheck
                  aria-hidden="true"
                  className={iconPulses[index] ? "patient-preview-point-icon-pulse" : ""}
                />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
};

export default PatientDashboard;
