import React from "react";
import { useTranslation } from "react-i18next";
import "../../styles/SidebarLanguageSwitcher.css";

const SidebarLanguageToggle = () => {
  const { i18n } = useTranslation();
  const current = i18n.language;

  const toggleLang = () => {
    const nextLang = current === "en" ? "ar" : "en";
    i18n.changeLanguage(nextLang);

    document.documentElement.dir = nextLang === "ar" ? "rtl" : "ltr";
    document.body.classList.remove("rtl", "ltr");
    document.body.classList.add(nextLang === "ar" ? "rtl" : "ltr");
  };

  return (
    <div className="sidebar-lang-toggle" onClick={toggleLang}>
      <div className={`toggle-slider ${current === "ar" ? "right" : "left"}`} />

      <span className="flag-icon">{current === "en" ? "🇺🇸" : "🇸🇦"}</span>
      <span className="flag-icon">{current === "en" ? "🇸🇦" : "🇺🇸"}</span>
    </div>
  );
};

export default SidebarLanguageToggle;
