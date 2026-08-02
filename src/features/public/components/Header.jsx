import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LuLanguages } from "react-icons/lu";
import { ROUTES } from "../../../utils/routes";
import SecondaryButton from "../../../components/ui/SecondaryButton";
import "./Header.css";

// "platform" / "aiAssistant" / "roadmap" / "faq" have no dedicated route —
// they're sections on the single-scroll HomePage (see HomePage.jsx), so
// they link to that section's id there. The rest are their own routed
// pages, unchanged from before.
const NAV_ITEMS = [
  { key: "home", to: "/" },
  { key: "platform", to: "/#platform" },
  { key: "technology", to: "/technology" },
  { key: "aiAssistant", to: "/#ai-assistant" },
  { key: "howItWorks", to: "/how-it-works" },
  { key: "roadmap", to: "/#roadmap" },
  { key: "faq", to: "/#faq" },
  { key: "contact", to: "/contact" },
];

const Header = () => {
  const { t, i18n } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Same toggle-on-click pattern already used elsewhere in the app
  // (SidebarLanguageSwitcher.jsx) — no dropdown, just flips to the other
  // language and updates document direction.
  const toggleLanguage = () => {
    const nextLang = i18n.language === "ar" ? "en" : "ar";
    i18n.changeLanguage(nextLang);
    document.documentElement.dir = nextLang === "ar" ? "rtl" : "ltr";
    document.body.classList.remove("rtl", "ltr");
    document.body.classList.add(nextLang === "ar" ? "rtl" : "ltr");
  };

  return (
    <header className="header-root">
      <nav className="header-nav">
        <div className="header-logo-wrap">
          <Link className="header-logo" to="/">
            <span className="header-logo-mark">KG</span>
            KneeGuide
          </Link>
        </div>

        <button
          type="button"
          className="header-menu-toggle"
          aria-expanded={menuOpen}
          aria-label="Toggle navigation menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>

        {/* `display: contents` on desktop (see Header.css) lets these two
            groups act as independent, individually-centered grid items of
            `.header-nav` — the actual balanced 3-zone layout — while still
            being one toggleable DOM unit for the unchanged mobile dropdown
            behavior below 768px. */}
        <div className={`header-mobile-panel${menuOpen ? " header-links-open" : ""}`}>
          <div className="header-links">
            {NAV_ITEMS.map((item) => (
              <Link key={item.key} className="header-link" to={item.to}>
                {t(`publicHeader.nav.${item.key}`)}
              </Link>
            ))}
          </div>

          <div className="header-actions">
            <button
              type="button"
              className="header-lang-toggle"
              onClick={toggleLanguage}
              aria-label={t("publicHeader.languageSwitchLabel")}
            >
              <LuLanguages aria-hidden="true" />
              {t("publicHeader.languageSwitchTo")}
            </button>

            <SecondaryButton to={ROUTES.LOGIN} size="sm" className="header-cta">
              {t("publicHeader.login")}
            </SecondaryButton>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
