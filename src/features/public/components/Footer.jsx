import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import RevealSection from "./RevealSection";
import BrandLogo from "./BrandLogo";
import { PUBLIC_NAVIGATION, PUBLIC_ACCOUNT_LINKS } from "../navigation/publicNavigation";
import { useSectionNavigation } from "../navigation/useSectionNavigation";
import "./Footer.css";

const Footer = () => {
  const { t } = useTranslation();
  const { goToSection, goHome } = useSectionNavigation();

  return (
    <footer className="footer-root">
      <div className="footer-container">
        <RevealSection as="div">
          <div className="footer-grid">
            <div className="footer-brand">
              <Link
                to="/"
                className="footer-logo"
                onClick={(event) => {
                  event.preventDefault();
                  goHome();
                }}
              >
                <BrandLogo className="footer-logo-mark brand-logo-light" />
                {t("publicFooter.brand")}
              </Link>
              <p className="footer-tagline">{t("publicFooter.description")}</p>
            </div>

            {PUBLIC_NAVIGATION.map((group) => (
              <div className="footer-links-col" key={group.key}>
                <span className="footer-links-title">{t(group.labelKey)}</span>
                <ul className="footer-links">
                  {group.items.map((item) => (
                    <li key={item.key}>
                      <Link
                        to={`/#${item.id}`}
                        onClick={(event) => {
                          event.preventDefault();
                          goToSection(item.id);
                        }}
                      >
                        {t(item.labelKey)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Same PUBLIC_ACCOUNT_LINKS the Header's Account mega-menu
                card renders (Patient Login / Clinician Login / Create
                Account — the first two are discovery labels only, both
                landing on the one real Login route). Not from
                PUBLIC_NAVIGATION since these are real app routes, not
                homepage sections, so they're plain Links rather than
                going through goToSection. Reuses the exact same
                .footer-links look as Product/Explore — no button styling
                introduced. */}
            <div className="footer-links-col">
              <span className="footer-links-title">{t("publicNavigation.groups.account")}</span>
              <ul className="footer-links">
                {PUBLIC_ACCOUNT_LINKS.map((link) => (
                  <li key={link.key}>
                    <Link to={link.to}>{t(link.labelKey)}</Link>
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
