import React, { useState, Children, useRef, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import "../../styles/Stepper.css";
import { useTranslation } from "react-i18next";

export default function Stepper({
  children,
  initialStep = 1,
  onStepChange = () => {},
  onFinalStepCompleted = () => {},
  validateStep = () => true,
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

    setDirection(1);
    updateStep(totalSteps + 1);
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

        {/* Footer Buttons */}
        {!isCompleted && (
          <div className="footer-container">
            <div className="footer-nav">

              {currentStep !== 1 && (
                <button className="back-button" onClick={handleBack}>
                  {t("buttons.back")}
                </button>
              )}

              <button
                onClick={isLastStep ? handleComplete : handleNext}
                className="next-button"
              >
                {isLastStep ? t("buttons.complete") : t("buttons.continue")}
              </button>
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
  const ref = useRef(null);

  return (
    <motion.div
      className={className}
      animate={{ height: isCompleted ? 0 : height }}
      transition={{ type: "spring", duration: 0.4 }}
      style={{ overflow: "hidden", position: "relative" }}
    >
      <AnimatePresence initial={false} custom={direction} mode="sync">
        {!isCompleted && (
          <SlideTransition key={currentStep} direction={direction} onHeightReady={(h) => setHeight(h)}>
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
  }, [children]);

  return (
    <motion.div
      ref={ref}
      custom={direction}
      initial="enter"
      animate="center"
      exit="exit"
      variants={stepVariants}
      transition={{ duration: 0.35 }}
      style={{ position: "absolute", left: 0, right: 0 }}
    >
      {children}
    </motion.div>
  );
}

const stepVariants = {
  enter: (dir) => ({ x: dir >= 0 ? "-100%" : "100%", opacity: 0 }),
  center: { x: "0%", opacity: 1 },
  exit: (dir) => ({ x: dir >= 0 ? "40%" : "-40%", opacity: 0 }),
};

export function Step({ children }) {
  return <div className="step-default">{children}</div>;
}

function StepIndicator({ step, currentStep }) {
  const status =
    currentStep === step ? "active" : currentStep < step ? "inactive" : "complete";

  return (
    <motion.div className="step-indicator" animate={status} initial={false}>
      <motion.div
        className="step-indicator-inner"
        variants={{
          inactive: { backgroundColor: "#222", color: "#999" },
          active: { backgroundColor: "#8757ff", color: "#fff" },
          complete: { backgroundColor: "#8757ff", color: "#fff" },
        }}
      >
        {status === "complete" ? "✓" : step}
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
          backgroundColor: isComplete ? "#8757ff" : "#444",
        }}
        transition={{ duration: 0.35 }}
      />
    </div>
  );
}
