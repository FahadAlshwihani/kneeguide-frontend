import React, { useState, Children, useCallback, useEffect, useRef, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import "../../styles/Stepper.css";
import { useTranslation } from "react-i18next";
import { LuCheck } from "react-icons/lu";
import PrimaryButton from "./PrimaryButton";
import SecondaryButton from "./SecondaryButton";

export default function Stepper({
  children,
  initialStep = 1,
  onStepChange = () => {},
  onFinalStepCompleted = () => {},
  validateStep = () => true,
  // True only while the final step's submit is actually in flight (real
  // backend request — see Register.jsx) — disables both footer buttons
  // and shows PrimaryButton's own built-in loading state on Complete, so
  // there's no separate full-page loader for this and no way to
  // double-submit or navigate away mid-request.
  submitting = false,
  validating = false,
}) {
  const { t } = useTranslation();

  const [currentStep, setCurrentStep] = useState(initialStep);
  const [direction, setDirection] = useState(0);

  const stepsArray = Children.toArray(children);
  const totalSteps = stepsArray.length;
  const isCompleted = currentStep > totalSteps;
  const isLastStep = currentStep === totalSteps;

  const updateStep = (newStep) => {
    setCurrentStep(newStep);

    if (newStep > totalSteps) {
      onFinalStepCompleted();
    } else {
      onStepChange(newStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      updateStep(currentStep - 1);
    }
  };

  const handleNext = async () => {
    const valid = await validateStep(currentStep);
    if (!valid) return;

    if (!isLastStep) {
      setDirection(1);
      updateStep(currentStep + 1);
    }
  };

  const handleComplete = async () => {
    const valid = await validateStep(currentStep);
    if (!valid) return;

    // Deliberately does NOT advance currentStep past totalSteps anymore.
    // It used to call updateStep(totalSteps + 1) here, which flips
    // isCompleted synchronously — before the real submit (Register.jsx's
    // onFinalStepCompleted, an async network request) even starts —
    // collapsing the review step to height:0 and hiding the footer
    // (including the Complete button and its own loading spinner) while
    // the request was still in flight. That's what made a real network
    // delay look like a frozen/dead click, and left a failed submission on
    // a collapsed, buttonless step with no visible way to retry. Staying
    // on the last step keeps the button (and its `submitting`-driven
    // loading state, already wired via Register.jsx's `loading`) visible
    // for the entire request lifecycle; the caller now owns 100% of what
    // happens after a real success (Register.jsx's own fade + navigate to
    // OTP), so Stepper no longer needs a separate "completed" visual here.
    onFinalStepCompleted();
  };

  return (
    <div className="outer-container">
      <div className="step-circle-container">

        {/* Step Indicators */}
        <div className="step-indicator-row">
          {stepsArray.map((_, index) => {
            const step = index + 1;
            const isNotLast = index < totalSteps - 1;

            return (
              <React.Fragment key={step}>
                <StepIndicator step={step} currentStep={currentStep} />
                {isNotLast && <StepConnector isComplete={currentStep > step} />}
              </React.Fragment>
            );
          })}
        </div>

        {/* Step Content */}
        <StepContentWrapper
          isCompleted={isCompleted}
          currentStep={currentStep}
          direction={direction}
          className="step-content-default"
        >
          {stepsArray[currentStep - 1]}
        </StepContentWrapper>

        {/* Footer Buttons — same PrimaryButton/SecondaryButton language as
            every other auth action (Login's submit, "Create account"),
            not a separate React-Bits button style. Back is disabled (not
            hidden) while the final step is actually submitting, so a
            request in flight can't be navigated away from mid-air. */}
        {!isCompleted && (
          <div className="footer-container">
            <div className="footer-nav">
              {currentStep !== 1 && (
                <SecondaryButton
                  type="button"
                  size="sm"
                  showArrow={false}
                  disabled={submitting || validating}
                  onClick={handleBack}
                  className="stepper-back-button"
                >
                  {t("buttons.back")}
                </SecondaryButton>
              )}

              <PrimaryButton
                type="button"
                size="sm"
                showArrow={false}
                loading={(isLastStep && submitting) || validating}
                disabled={(isLastStep && submitting) || validating}
                onClick={isLastStep ? handleComplete : handleNext}
                className="stepper-next-button"
              >
                {isLastStep ? t("buttons.complete") : t("buttons.continue")}
              </PrimaryButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------ CONTENT ------------ */
function StepContentWrapper({ isCompleted, currentStep, direction, children, className }) {
  const [height, setHeight] = useState(0);
  const wrapperRef = useRef(null);
  const prevStepRef = useRef(null);
  const handleHeightReady = useCallback((h) => setHeight(h), []);

  // Moves focus into the new step (its own heading — see the
  // `data-step-heading` attribute callers put on each Step's own <h3>,
  // e.g. Register.jsx) whenever the step actually changes via Next/Back,
  // so keyboard/screen-reader users land somewhere meaningful instead of
  // focus silently staying on the now-hidden previous step's button.
  // Guarded to skip the very first render — arriving on step 1 shouldn't
  // steal focus from wherever the page naturally put it.
  useEffect(() => {
    const isFirstRender = prevStepRef.current === null;
    prevStepRef.current = currentStep;
    if (isFirstRender) return undefined;

    const frame = requestAnimationFrame(() => {
      const heading = wrapperRef.current?.querySelector("[data-step-heading]");
      if (!heading) return;
      if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [currentStep]);

  return (
    <motion.div
      ref={wrapperRef}
      className={className}
      animate={{ height: isCompleted ? 0 : height }}
      transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
      style={{ overflow: "hidden", position: "relative" }}
    >
      <AnimatePresence initial={false} custom={direction} mode="sync">
        {!isCompleted && (
          <SlideTransition key={currentStep} direction={direction} onHeightReady={handleHeightReady}>
            {children}
          </SlideTransition>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SlideTransition({ children, direction, onHeightReady }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    if (ref.current) onHeightReady(ref.current.offsetHeight);
  }, [children, onHeightReady]);

  return (
    <motion.div
      ref={ref}
      custom={direction}
      initial="enter"
      animate="center"
      exit="exit"
      variants={stepVariants}
      style={{ position: "absolute", left: 0, right: 0 }}
    >
      {children}
    </motion.div>
  );
}

// Restrained on purpose — a small, precise displacement (not the previous
// full/40%-width slide), matching the same "clinical, not playful" motion
// language as the Login<->Register transition (AuthLayout.jsx). Entrance
// and exit each carry their own transition (below) rather than one flat
// duration for both, per the same distinction that transition draws:
// exit noticeably quicker (~180ms) than entrance (~300ms), no bounce.
const stepVariants = {
  enter: (dir) => ({ x: dir >= 0 ? -20 : 20, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.3, ease: [0.22, 0.61, 0.36, 1] } },
  exit: (dir) => ({ x: dir >= 0 ? 14 : -14, opacity: 0, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } }),
};

export function Step({ children }) {
  return <div className="step-default">{children}</div>;
}

function StepIndicator({ step, currentStep }) {
  const status =
    currentStep === step ? "active" : currentStep < step ? "inactive" : "complete";

  return (
    <motion.div
      className="step-indicator"
      animate={status}
      initial={false}
      aria-current={status === "active" ? "step" : undefined}
    >
      {/* Colors are CSS-variable references, not literal hex — motion
          sets them as inline styles either way, but the browser resolves
          `var(--color-primary)` at paint time, so this still tracks the
          real design token (index.css) instead of a hardcoded duplicate
          of it. Complete uses a check ICON (LuCheck, same icon Login's
          own success state uses), not a text glyph — status is legible
          without relying on color alone, satisfying that on its own; the
          background color is the same for active/complete on purpose
          (the icon swap is what distinguishes them, not a third hue). */}
      <motion.div
        className="step-indicator-inner"
        variants={{
          inactive: { backgroundColor: "rgba(255, 255, 255, 0.06)", color: "var(--color-muted)" },
          active: { backgroundColor: "var(--color-primary)", color: "#ffffff" },
          complete: { backgroundColor: "var(--color-primary)", color: "#ffffff" },
        }}
      >
        {status === "complete" ? <LuCheck aria-hidden="true" /> : step}
      </motion.div>
    </motion.div>
  );
}

function StepConnector({ isComplete }) {
  return (
    <div className="step-connector">
      <motion.div
        className="step-connector-inner"
        animate={{
          width: isComplete ? "100%" : 0,
          backgroundColor: isComplete ? "var(--color-primary)" : "rgba(255, 255, 255, 0.1)",
        }}
        transition={{ duration: 0.35 }}
      />
    </div>
  );
}
