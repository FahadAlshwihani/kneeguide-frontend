import React from "react";
import { useTranslation } from "react-i18next";
import { getWeekLabel } from "../../data/patientRehabPlanData";
import "./ProfileHero.css";

/**
 * Compact Profile hero (Section 5) — avatar/initials, name, and a rehab
 * context line, NOT a large banner. The "Week N" figure reuses the exact
 * same `getWeekLabel()`/`patientExercises.session.weekLabel` pair
 * PatientExercises.jsx's own rehab timeline already uses (audited first —
 * see that page) rather than inventing a second "week" phrasing or a fake
 * program-start-date calculation; that function's own doc comment already
 * explains why it's a deterministic flavor number, not real enrollment
 * data.
 */
const ProfileHero = ({ user, avatarLetters }) => {
  const { t } = useTranslation();
  const weekLabel = t("patientExercises.session.weekLabel", { number: getWeekLabel() });

  return (
    <header className="pfl-hero">
      <div className="pfl-hero-avatar" aria-hidden="true">
        {avatarLetters}
      </div>
      <div className="pfl-hero-body">
        <h1 className="pfl-hero-name">
          {user.first_name} {user.last_name}
        </h1>
        <p className="pfl-hero-sub">{t("patientProfile.hero.role")}</p>
        <p className="pfl-hero-context">
          {t("patientProfile.hero.context", { phase: t(`patientProfile.rehabPhase.${user.rehabPhaseKey}`), week: weekLabel })}
        </p>
      </div>
    </header>
  );
};

export default ProfileHero;
