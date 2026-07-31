import React from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../../../utils/routes";
import Reveal from "../../components/Reveal";
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
            <Link to={ROUTES.REGISTER} className="cta-btn-primary">
              Start Your Recovery
            </Link>
            <Link to={ROUTES.LOGIN} className="cta-btn-secondary">
              I&apos;m a Clinician
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default CTA;
