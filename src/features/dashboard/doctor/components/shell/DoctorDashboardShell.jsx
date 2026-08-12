import React, { useState } from "react";
import { useAuth } from "../../../../../context/AuthContext";
import { DoctorAssistantProvider } from "../../assistant/DoctorAssistantContext";
import DoctorSidebar from "../DoctorSidebar";
import DoctorTopbar from "./DoctorTopbar";
import DoctorAssistantDrawer from "./DoctorAssistantDrawer";
import "./DoctorDashboardShell.css";

/**
 * The Doctor application shell (Section 1) — Sidebar + Topbar + main
 * content, wrapping whatever the current Doctor route renders. This is
 * the new internal implementation behind DoctorLayout.jsx's unchanged
 * `{ active, children }` API, so none of the 9 existing Doctor page files
 * needed to change to get it.
 *
 * `activeOverlay` is ONE value (`null | 'assistant' | 'notifications' |
 * 'account'`), not three independent booleans — opening any one of the
 * three transient surfaces automatically closes whichever other was open
 * (Section 21/28). `mobileNavOpen` is a separate boolean (it's the global
 * nav drawer, not a Topbar-anchored popover), but `openOverlay`/
 * `openMobileNav` below each close the other kind too — on a narrow
 * viewport the nav drawer and, say, the Assistant Drawer would otherwise
 * both be able to sit open at once, which is exactly the "only one
 * transient surface open at a time" rule Section 21 asks for, just
 * applied across both categories, not only within the popover trio.
 *
 * `DoctorAssistantProvider` mounts HERE — above both the Topbar (which
 * renders the Assistant Drawer) and `{children}` (which, on the Home
 * route, is DoctorHomeAssistant.jsx) — so both read/write the exact same
 * conversation state (Section 10). See that file's own comment for why
 * this provider remounting on Doctor page navigation (this shell isn't
 * behind a persistent router layout) is fine: the localStorage round-trip
 * already carries a live conversation across that remount.
 */
const DoctorDashboardShell = ({ active, children }) => {
  const { logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState(null);
  const [overlayTriggerRef, setOverlayTriggerRef] = useState(null);

  const openOverlay = (name, triggerRef) => {
    setMobileNavOpen(false);
    setActiveOverlay(name);
    setOverlayTriggerRef(triggerRef || null);
  };

  const closeOverlay = () => {
    setActiveOverlay(null);
    overlayTriggerRef?.current?.focus();
    setOverlayTriggerRef(null);
  };

  const openMobileNav = () => {
    setActiveOverlay(null);
    setMobileNavOpen(true);
  };

  return (
    <DoctorAssistantProvider>
      <div className="doctor-shell">
        <DoctorSidebar variant="rail" active={active} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed((value) => !value)} />
        <DoctorSidebar variant="drawer" active={active} isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

        <div className="doctor-shell-main">
          <DoctorTopbar
            activeOverlay={activeOverlay}
            onOpenOverlay={openOverlay}
            onCloseOverlay={closeOverlay}
            onOpenMobileNav={openMobileNav}
            onLogout={logout}
          />

          <div className="doctor-shell-content">{children}</div>
        </div>

        <DoctorAssistantDrawer isOpen={activeOverlay === "assistant"} onClose={closeOverlay} triggerRef={overlayTriggerRef} />
      </div>
    </DoctorAssistantProvider>
  );
};

export default DoctorDashboardShell;
