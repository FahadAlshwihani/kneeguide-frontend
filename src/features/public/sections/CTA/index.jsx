import React from "react";
import { useTranslation } from "react-i18next";
import { ROUTES } from "../../../../utils/routes";
import RevealSection from "../../components/RevealSection";
import PrimaryButton from "../../../../components/ui/PrimaryButton";
import SecondaryButton from "../../../../components/ui/SecondaryButton";
import "./CTA.css";

const CTA = () => {
  const { t } = useTranslation();

  return (
    <section className="cta-root">
      <div className="cta-container">
        <RevealSection className="cta-content">
          <span className="cta-badge">{t("publicCta.badge")}</span>
          <h2 className="cta-title">{t("publicCta.title")}</h2>
          <p className="cta-description">{t("publicCta.description")}</p>
          <div className="cta-actions">
            <PrimaryButton to={ROUTES.REGISTER} size="lg" className="cta-btn-primary">
              {t("publicCta.patientAction")}
            </PrimaryButton>
            <SecondaryButton to={ROUTES.LOGIN} size="lg" className="cta-btn-secondary">
              {t("publicCta.clinicianAction")}
            </SecondaryButton>
          </div>
        </RevealSection>
      </div>
    </section>
  );
};

export default CTA;
