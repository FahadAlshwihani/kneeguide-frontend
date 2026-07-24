import React from "react";
import { useTranslation } from "react-i18next";
import "./LanguageDropdown.css";

const LanguageDropdown = () => {
  const { i18n } = useTranslation();

  const changeLang = (lng) => {
    i18n.changeLanguage(lng);

    document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
    document.body.classList.remove("rtl", "ltr");
    document.body.classList.add(lng === "ar" ? "rtl" : "ltr");
  };

  return (
    <div className="lang-dropdown-container">
      <select
        className="lang-dropdown"
        value={i18n.language}
        onChange={(e) => changeLang(e.target.value)}
      >
        <option value="en">🇺🇸 English</option>
        <option value="ar">🇸🇦 العربية</option>
      </select>
    </div>
  );
};

export default LanguageDropdown;
