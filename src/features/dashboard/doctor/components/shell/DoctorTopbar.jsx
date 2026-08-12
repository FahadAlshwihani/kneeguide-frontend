import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { LuSparkles, LuBell, LuMenu } from "react-icons/lu";
import { useDoctorAssistant } from "../../assistant/DoctorAssistantContext";
import { useDoctorNotifications } from "../../assistant/useDoctorNotifications";
import { useDoctorProfile } from "../../../../../domain/rehab/useRehabDomain";
import { deriveInitialsFromName } from "../../../../../domain/rehab/rehabDerived";
import { ROUTES } from "../../../../../utils/routes";
import Popover from "../../../../../components/ui/Popover";
import DoctorNotificationsPanel from "./DoctorNotificationsPanel";
import DoctorAccountMenu from "./DoctorAccountMenu";
import "./DoctorTopbar.css";

// Per-route context title — Home shows the personalized greeting instead
// (Section 7); every other route shows its own localized page title
// (Section 7's own "for other routes, it can show their localized page
// title later" — implemented now since it costs one small map, not a
// redesign of any of those pages).
const ROUTE_TITLE_KEYS = {
  [ROUTES.DOCTOR_PATIENTS]: "doctorShell.topbar.pageTitles.patients",
  [ROUTES.APPOINTMENTS]: "doctorShell.topbar.pageTitles.appointments",
  [ROUTES.DOCTOR_REPORTS]: "doctorShell.topbar.pageTitles.reports",
  [ROUTES.DOCTOR_PROFILE]: "doctorShell.topbar.pageTitles.profile",
};

/**
 * Compact application topbar (Section 6) — page context on the start
 * side, Assistant launcher / notifications / account on the end side.
 * Only ONE transient surface (assistant drawer / notifications / account)
 * is ever open at once — `activeOverlay` (owned by DoctorDashboardShell.jsx,
 * passed down) is a single `null | 'assistant' | 'notifications' | 'account'`
 * value rather than three independent booleans that could all be true
 * together (Section 21/28).
 */
const DoctorTopbar = ({ activeOverlay, onOpenOverlay, onCloseOverlay, onOpenMobileNav, onLogout }) => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { displayName, greetingKey } = useDoctorAssistant();
  const { notifications, readIds, unreadCount, markRead, markAllRead } = useDoctorNotifications();
  const doctorProfile = useDoctorProfile();

  const assistantTriggerRef = useRef(null);
  const notificationsTriggerRef = useRef(null);
  const accountTriggerRef = useRef(null);

  // The Topbar avatar/account-menu show the doctor's PROFESSIONAL identity
  // (Doctor Profile brief, Section 2 — one identity powering Profile,
  // Topbar avatar, and account menu), derived from the canonical
  // `doctorProfile` record rather than the raw login user — distinct on
  // purpose from `displayName` above, which stays the personal "Good
  // morning, {{name}}" greeting tied to whoever is logged in.
  const professionalInitials = deriveInitialsFromName(doctorProfile.name);

  const pageTitleKey = ROUTE_TITLE_KEYS[pathname];
  const contextLabel = pageTitleKey ? t(pageTitleKey) : t(`doctorDashboard.greeting.${greetingKey}`, { name: displayName });

  const toggleOverlay = (name, triggerRef) => {
    if (activeOverlay === name) {
      onCloseOverlay();
    } else {
      onOpenOverlay(name, triggerRef);
    }
  };

  return (
    <header className="doctor-topbar">
      <div className="doctor-topbar-start">
        <button type="button" className="doctor-topbar-menu-btn" onClick={onOpenMobileNav} aria-label={t("doctorShell.sidebar.openNav")}>
          <LuMenu aria-hidden="true" />
        </button>
        <p className="doctor-topbar-context" dir="auto">
          {contextLabel}
        </p>
      </div>

      <div className="doctor-topbar-end">
        <div className="ui-popover-anchor">
          <button
            type="button"
            ref={assistantTriggerRef}
            className={`doctor-topbar-assistant-btn${activeOverlay === "assistant" ? " doctor-topbar-assistant-btn--active" : ""}`}
            onClick={() => toggleOverlay("assistant", assistantTriggerRef)}
            aria-expanded={activeOverlay === "assistant"}
          >
            <LuSparkles aria-hidden="true" />
            <span>{t("doctorShell.assistantLauncher.label")}</span>
          </button>
        </div>

        <div className="ui-popover-anchor">
          <button
            type="button"
            ref={notificationsTriggerRef}
            className="doctor-topbar-icon-btn"
            onClick={() => toggleOverlay("notifications", notificationsTriggerRef)}
            aria-label={t("doctorShell.notifications.bellLabel", { count: unreadCount })}
            aria-expanded={activeOverlay === "notifications"}
          >
            <LuBell aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="doctor-topbar-badge" aria-hidden="true">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <Popover isOpen={activeOverlay === "notifications"} onClose={onCloseOverlay} triggerRef={notificationsTriggerRef} ariaLabel={t("doctorShell.notifications.title")}>
            <DoctorNotificationsPanel notifications={notifications} readIds={readIds} unreadCount={unreadCount} onMarkRead={markRead} onMarkAllRead={markAllRead} onClose={onCloseOverlay} />
          </Popover>
        </div>

        <div className="ui-popover-anchor">
          <button
            type="button"
            ref={accountTriggerRef}
            className="doctor-topbar-avatar-btn"
            onClick={() => toggleOverlay("account", accountTriggerRef)}
            aria-label={t("doctorShell.account.menuLabel")}
            aria-expanded={activeOverlay === "account"}
          >
            {doctorProfile.avatarDataUrl ? (
              <img src={doctorProfile.avatarDataUrl} alt="" className="doctor-topbar-avatar-img" />
            ) : (
              <span aria-hidden="true">{professionalInitials}</span>
            )}
          </button>
          <Popover isOpen={activeOverlay === "account"} onClose={onCloseOverlay} triggerRef={accountTriggerRef} ariaLabel={t("doctorShell.account.menuLabel")}>
            <DoctorAccountMenu displayName={doctorProfile.name} initials={professionalInitials} avatarDataUrl={doctorProfile.avatarDataUrl} onClose={onCloseOverlay} onLogout={onLogout} />
          </Popover>
        </div>
      </div>
    </header>
  );
};

export default DoctorTopbar;
