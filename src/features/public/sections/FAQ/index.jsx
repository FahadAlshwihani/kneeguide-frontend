import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import RevealSection from "../../components/RevealSection";
import "./FAQ.css";

const FAQ_ITEM_KEYS = [
  "physicalTherapy",
  "doctorVisibility",
  "dataSecurity",
  "equipment",
  "noReferral",
];

const FAQ = () => {
  const { t } = useTranslation();
  const [openKey, setOpenKey] = useState(null);

  const handleToggle = (key) => {
    setOpenKey((current) => (current === key ? null : key));
  };

  return (
    <section className="faq-root" id="faq">
      <div className="faq-container">
        <RevealSection className="faq-header">
          <span className="faq-badge">{t("publicFaq.badge")}</span>
          <h2 className="faq-title">{t("publicFaq.title")}</h2>
        </RevealSection>

        <div className="faq-list">
          {FAQ_ITEM_KEYS.map((key, index) => {
            const isOpen = openKey === key;
            const triggerId = `faq-trigger-${key}`;
            const panelId = `faq-panel-${key}`;

            return (
              <RevealSection
                as="div"
                key={key}
                delay={index * 0.06}
                className={`faq-item${isOpen ? " faq-item-open" : ""}`}
              >
                <h3 className="faq-item-heading">
                  <button
                    type="button"
                    id={triggerId}
                    className="faq-question"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => handleToggle(key)}
                  >
                    <span className="faq-question-text">
                      {t(`publicFaq.items.${key}.question`)}
                    </span>
                    <span className="faq-icon" aria-hidden="true">
                      <span className="faq-icon-bar faq-icon-bar-h" />
                      <span className="faq-icon-bar faq-icon-bar-v" />
                    </span>
                  </button>
                </h3>

                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  aria-hidden={!isOpen}
                  className="faq-panel"
                >
                  <div className="faq-panel-inner">
                    <p className="faq-answer">
                      {t(`publicFaq.items.${key}.answer`)}
                    </p>
                  </div>
                </div>
              </RevealSection>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
