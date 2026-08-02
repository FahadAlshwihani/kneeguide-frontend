import React from "react";
import { ROUTES } from "../../../../utils/routes";
import Reveal from "../../components/Reveal";
import PrimaryButton from "../../../../components/ui/PrimaryButton";
import SecondaryButton from "../../../../components/ui/SecondaryButton";
import "./CTA.css";

const CTA = () => {
  return (
    <section className="cta-root">
      <div className="cta-container">
        <Reveal className="cta-content">
          <h2 className="cta-title">Ready to guide your recovery?</h2>
          <p className="cta-description">
            Join patients and clinicians already using KneeGuide to make
            every day of recovery count.
          </p>
          <div className="cta-actions">
            <PrimaryButton to={ROUTES.REGISTER} size="lg">
              Start Your Recovery
            </PrimaryButton>
            <SecondaryButton to={ROUTES.LOGIN} size="lg">
              I&apos;m a Clinician
            </SecondaryButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default CTA;
