import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { LuUser, LuLanguages, LuLogOut } from "react-icons/lu";
import { ROUTES } from "../../../../../utils/routes";
import "./DoctorAccountMenu.css";

/**
 * Account dropdown content (rendered inside components/ui/Popover.jsx).
 * "Preferences" was deliberately NOT added as a separate item (Section
 * 17's own "do not invent new routes unless required") — audited first:
 * DoctorProfile.jsx has no preferences section/tab of its own to route
 * to, unlike Patient's Profile. Language is handled inline here via the
 * EXISTING i18next instance (`i18n.changeLanguage`) — the exact same call
 * SidebarLanguageSwitcher/LanguageDropdown already make — never a second
 * language state; i18n.js's own `languageChanged` listener already
 * updates direction/body classes globally, so this never touches DOM
 * attributes directly.
 */
const DoctorAccountMenu = ({ displayName, initials, avatarDataUrl, onClose, onLogout }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const goToProfile = () => {
    navigate(ROUTES.DOCTOR_PROFILE);
    onClose?.();
  };

  const setLanguage = (lng) => {
    if (lng !== i18n.language) i18n.changeLanguage(lng);
  };

  // The actual sign-out call is owned by DoctorDashboardShell.jsx (the
  // ONE place in the new shell that calls useAuth().logout(), unchanged
  // from the existing implementation) and passed down as `onLogout` —
  // this component never imports useAuth() itself.
  const handleLogout = () => {
    onClose?.();
    onLogout?.();
  };

  return (
    <div className="doctor-account-menu">
      <div className="doctor-account-menu-header">
        <span className="doctor-account-menu-avatar" aria-hidden="true">
          {avatarDataUrl ? <img src={avatarDataUrl} alt="" className="doctor-account-menu-avatar-img" /> : initials}
        </span>
        <span className="doctor-account-menu-name" dir="auto">
          {displayName}
        </span>
      </div>

      <button type="button" className="doctor-account-menu-item" onClick={goToProfile}>
        <LuUser aria-hidden="true" />
        <span>{t("doctorShell.account.profile")}</span>
      </button>

      <div className="doctor-account-menu-language">
        <span className="doctor-account-menu-language-label">
          <LuLanguages aria-hidden="true" />
          <span>{t("doctorShell.account.language")}</span>
        </span>
        <div className="doctor-account-menu-language-options" role="radiogroup" aria-label={t("doctorShell.account.language")}>
          <button type="button" role="radio" aria-checked={i18n.language === "en"} className={`doctor-account-lang-btn${i18n.language === "en" ? " doctor-account-lang-btn--active" : ""}`} onClick={() => setLanguage("en")}>
            {t("doctorShell.account.languageEnglish")}
          </button>
          <button type="button" role="radio" aria-checked={i18n.language === "ar"} className={`doctor-account-lang-btn${i18n.language === "ar" ? " doctor-account-lang-btn--active" : ""}`} onClick={() => setLanguage("ar")}>
            {t("doctorShell.account.languageArabic")}
          </button>
        </div>
      </div>

      <button type="button" className="doctor-account-menu-item doctor-account-menu-item--danger" onClick={handleLogout}>
        <LuLogOut aria-hidden="true" />
        <span>{t("doctorShell.account.logout")}</span>
      </button>
    </div>
  );
};

export default DoctorAccountMenu;
