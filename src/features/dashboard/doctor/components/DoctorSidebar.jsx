import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { LuHouse, LuUsers, LuCalendarClock, LuFileText, LuStethoscope } from "react-icons/lu";
import { ROUTES } from "../../../../utils/routes";
import { getSidebarToggleIcon } from "../../../../components/ui/sidebarToggleIcon";
import "../styles/DoctorSidebar.css";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Exactly the 4 items Section 4 asks for — Profile intentionally lives in
// the Topbar account menu instead (Section 15), not duplicated here.
// `key` matches the `active` string every Doctor page already passes to
// DoctorLayout (audited first — see the final report), so highlighting
// works correctly even for nested detail routes (e.g. a patient's own
// report/exercise page, which passes active="patients" despite its own
// pathname not matching ROUTES.DOCTOR_PATIENTS exactly) without needing
// any of those 9 existing page files to change.
const NAV_ITEMS = [
  { key: "dashboard", to: ROUTES.DOCTOR_DASHBOARD, Icon: LuHouse, labelKey: "doctorShell.sidebar.nav.home" },
  { key: "patients", to: ROUTES.DOCTOR_PATIENTS, Icon: LuUsers, labelKey: "doctorShell.sidebar.nav.patients" },
  { key: "appointments", to: ROUTES.APPOINTMENTS, Icon: LuCalendarClock, labelKey: "doctorShell.sidebar.nav.appointments" },
  { key: "reports", to: ROUTES.DOCTOR_REPORTS, Icon: LuFileText, labelKey: "doctorShell.sidebar.nav.reports" },
];

const NavList = ({ active, collapsed, onNavigate }) => {
  const { t } = useTranslation();
  return (
    <ul className="doctor-sidebar-nav-list">
      {NAV_ITEMS.map(({ key, to, Icon, labelKey }) => {
        const isActive = active === key;
        return (
          <li key={key}>
            <button
              type="button"
              className={`doctor-sidebar-nav-item${isActive ? " doctor-sidebar-nav-item--active" : ""}`}
              onClick={() => onNavigate(to)}
              aria-current={isActive ? "page" : undefined}
              title={collapsed ? t(labelKey) : undefined}
            >
              <Icon className="doctor-sidebar-nav-icon" aria-hidden="true" />
              {!collapsed && <span>{t(labelKey)}</span>}
              {collapsed && <span className="doctor-visually-hidden">{t(labelKey)}</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
};

/**
 * Doctor global navigation — the ONE application sidebar (Section 20's own
 * "APPLICATION SIDEBAR = global navigation", distinct from the Doctor Home
 * conversation-history rail, which is a DIFFERENT, unrelated component).
 *
 * `variant="rail"`: permanent desktop sidebar, collapsible in place (72-
 * 80px collapsed / 220-240px expanded, Section 4). `variant="drawer"`:
 * mobile-only overlay (Section 22 — "do not keep a permanent 220px
 * sidebar" on mobile), mounted only while `isOpen`. Mirrors the exact
 * rail/drawer split already established by PatientConversationHistory.jsx/
 * DoctorConversationHistory.jsx — same proven mobile-navigation pattern,
 * not a new one invented for this task.
 */
const DoctorSidebar = ({ variant, active, collapsed = false, onToggleCollapse, isOpen = false, onClose }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const reducedMotion = prefersReducedMotion();
  const panelRef = useRef(null);
  const isRTL = i18n.language === "ar";
  const offscreenX = isRTL ? "100%" : "-100%";

  const handleNavigate = (to) => {
    navigate(to);
    if (variant === "drawer") onClose?.();
  };

  useEffect(() => {
    if (variant !== "drawer" || !isOpen) return undefined;
    const panel = panelRef.current;
    panel?.querySelector("button, [href], [tabindex]:not([tabindex='-1'])")?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [variant, isOpen, onClose]);

  if (variant === "rail") {
    const ToggleIcon = getSidebarToggleIcon({ isRTL, isCollapsed: collapsed });
    return (
      <nav className={`doctor-sidebar${collapsed ? " doctor-sidebar--collapsed" : ""}`} aria-label={t("doctorShell.sidebar.navLabel")}>
        <div className="doctor-sidebar-brand">
          <span className="doctor-sidebar-brand-mark" aria-hidden="true">
            <LuStethoscope />
          </span>
          {!collapsed && (
            <span className="doctor-sidebar-brand-text">
              <span className="doctor-sidebar-brand-name">KneeGuide</span>
              <span className="doctor-sidebar-brand-sub">{t("doctorShell.sidebar.workspace")}</span>
            </span>
          )}
        </div>

        <NavList active={active} collapsed={collapsed} onNavigate={handleNavigate} />

        <div className="doctor-sidebar-bottom">
          <button
            type="button"
            className="doctor-sidebar-collapse-btn"
            onClick={onToggleCollapse}
            aria-label={t(collapsed ? "doctorShell.sidebar.expand" : "doctorShell.sidebar.collapse")}
            title={t(collapsed ? "doctorShell.sidebar.expand" : "doctorShell.sidebar.collapse")}
          >
            <ToggleIcon aria-hidden="true" />
            {!collapsed && <span>{t("doctorShell.sidebar.collapse")}</span>}
          </button>
        </div>
      </nav>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="doctor-sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.18 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={t("doctorShell.sidebar.navLabel")}
            className="doctor-sidebar doctor-sidebar--drawer"
            initial={reducedMotion ? { opacity: 0 } : { x: offscreenX }}
            animate={reducedMotion ? { opacity: 1 } : { x: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { x: offscreenX }}
            transition={{ duration: reducedMotion ? 0.15 : 0.24, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <div className="doctor-sidebar-brand">
              <span className="doctor-sidebar-brand-mark" aria-hidden="true">
                <LuStethoscope />
              </span>
              <span className="doctor-sidebar-brand-text">
                <span className="doctor-sidebar-brand-name">KneeGuide</span>
                <span className="doctor-sidebar-brand-sub">{t("doctorShell.sidebar.workspace")}</span>
              </span>
            </div>
            <NavList active={active} collapsed={false} onNavigate={handleNavigate} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DoctorSidebar;
