import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import RevealSection from "./RevealSection";
import "./Footer.css";

const PRODUCT_LINKS = [
  { to: "/features", key: "features" },
  { to: "/technology", key: "technology" },
  { to: "/how-it-works", key: "howItWorks" },
];

const COMPANY_LINKS = [
  { to: "/about", key: "about" },
  { to: "/contact", key: "contact" },
];

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="footer-root">
      <div className="footer-container">
        <RevealSection as="div">
          <div className="footer-grid">
            <div className="footer-brand">
              <span className="footer-logo">{t("publicFooter.brand")}</span>
              <p className="footer-tagline">{t("publicFooter.description")}</p>
            </div>

            <div className="footer-links-col">
              <span className="footer-links-title">{t("publicFooter.product.title")}</span>
              <ul className="footer-links">
                {PRODUCT_LINKS.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to}>{t(`publicFooter.product.${link.key}`)}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer-links-col">
              <span className="footer-links-title">{t("publicFooter.company.title")}</span>
              <ul className="footer-links">
                {COMPANY_LINKS.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to}>{t(`publicFooter.company.${link.key}`)}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p className="footer-copyright">
              {t("publicFooter.copyright", { year: new Date().getFullYear() })}
            </p>
          </div>
        </RevealSection>
      </div>
    </footer>
  );
};

export default Footer;
