import React from "react";
import { useTranslation } from "react-i18next";
import { LuMonitor, LuSun, LuMoon } from "react-icons/lu";
import SegmentedControl from "./SegmentedControl";
import { usePatientPreferences } from "../../preferences/PatientPreferencesContext";

/**
 * Preferences tab (Section 16-18/45-46) — Language + Appearance, both
 * backed by `usePatientPreferences()` (preferences/PatientPreferencesContext.jsx),
 * the ONE seam that calls the real `i18next.changeLanguage()` and resolves
 * System/Light/Dark to an actual `data-patient-theme` value. No local
 * component state, no Save button — every change here persists
 * immediately (`setLanguage`/`setTheme` write through to localStorage on
 * every call).
 */
const ProfilePreferencesTab = () => {
  const { t } = useTranslation();
  const { language, setLanguage, theme, setTheme } = usePatientPreferences();

  const languageOptions = [
    { value: "en", label: t("patientProfile.preferences.language.en") },
    { value: "ar", label: t("patientProfile.preferences.language.ar") },
  ];

  const themeOptions = [
    { value: "system", label: t("patientProfile.preferences.theme.system"), icon: <LuMonitor aria-hidden="true" /> },
    { value: "light", label: t("patientProfile.preferences.theme.light"), icon: <LuSun aria-hidden="true" /> },
    { value: "dark", label: t("patientProfile.preferences.theme.dark"), icon: <LuMoon aria-hidden="true" /> },
  ];

  return (
    <div className="pfl-tab-panel">
      <section className="pfl-card" aria-labelledby="pfl-language-heading">
        <h2 id="pfl-language-heading" className="pfl-card-title">
          {t("patientProfile.preferences.language.title")}
        </h2>
        <p className="pfl-card-subtext">{t("patientProfile.preferences.language.subtitle")}</p>
        <SegmentedControl legend={t("patientProfile.preferences.language.title")} options={languageOptions} value={language} onChange={setLanguage} name="patient-language" />
      </section>

      <section className="pfl-card" aria-labelledby="pfl-appearance-heading">
        <h2 id="pfl-appearance-heading" className="pfl-card-title">
          {t("patientProfile.preferences.theme.title")}
        </h2>
        <p className="pfl-card-subtext">{t("patientProfile.preferences.theme.subtitle")}</p>
        <SegmentedControl legend={t("patientProfile.preferences.theme.title")} options={themeOptions} value={theme} onChange={setTheme} name="patient-theme" />
      </section>
    </div>
  );
};

export default ProfilePreferencesTab;
