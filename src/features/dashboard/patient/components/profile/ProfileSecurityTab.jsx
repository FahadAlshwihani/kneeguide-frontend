import React from "react";
import { useTranslation } from "react-i18next";
import { LuLogOut } from "react-icons/lu";
import PatientButton from "../PatientButton";

/**
 * Security tab (Section 27) — Password + Current Session. "Sign out" is
 * wired to the REAL `useAuth().logout()` passed down from
 * PatientProfile.jsx — the same function PatientLayout's old floating
 * button called, unchanged, just relocated to be the ONE logout control in
 * the Patient Dashboard instead of two competing ones (Section 4).
 *
 * "Change password" is audited-honest, not fabricated (Section 27/32): the
 * original Security tab's button never had a click handler wired to any
 * backend endpoint, and no password-change API exists in this project
 * (audited before writing this). Rather than pretend it works OR silently
 * delete the section, it's shown disabled with a short explanatory note —
 * an honest "not available yet" state, consistent with Section 28's "we
 * are improving presentation and architecture, not inventing backend
 * functionality."
 */
const ProfileSecurityTab = ({ email, onLogout }) => {
  const { t } = useTranslation();

  return (
    <div className="pfl-tab-panel">
      <section className="pfl-card" aria-labelledby="pfl-password-heading">
        <h2 id="pfl-password-heading" className="pfl-card-title">
          {t("patientProfile.security.password.title")}
        </h2>
        <div className="pfl-row">
          <span>{t("patientProfile.security.password.account")}</span>
          <p dir="ltr">{email}</p>
        </div>
        <PatientButton type="button" variant="secondary" disabled title={t("patientProfile.security.password.unavailable")}>
          {t("patientProfile.security.password.change")}
        </PatientButton>
        <p className="pfl-card-footnote">{t("patientProfile.security.password.unavailable")}</p>
      </section>

      <section className="pfl-card" aria-labelledby="pfl-session-heading">
        <h2 id="pfl-session-heading" className="pfl-card-title">
          {t("patientProfile.security.session.title")}
        </h2>
        <div className="pfl-row">
          <span>{t("patientProfile.security.session.device")}</span>
          <p>{t("patientProfile.security.session.current")}</p>
        </div>
        <PatientButton type="button" variant="danger" icon={<LuLogOut aria-hidden="true" />} onClick={onLogout}>
          {t("patientProfile.security.session.signOut")}
        </PatientButton>
      </section>
    </div>
  );
};

export default ProfileSecurityTab;
