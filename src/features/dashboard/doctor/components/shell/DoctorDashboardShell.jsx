import React, { useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
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
 * (Section 21/28). `mobileNavOpen` is separate (it's the global nav
 * drawer, not a Topbar-anchored popover, and can coexist conceptually,
 * though in practice a doctor only ever interacts with one at a time).
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
    setActiveOverlay(name);
    setOverlayTriggerRef(triggerRef || null);
  };

  const closeOverlay = () => {
    setActiveOverlay(null);
    overlayTriggerRef?.current?.focus();
    setOverlayTriggerRef(null);
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
            onOpenMobileNav={() => setMobileNavOpen(true)}
            onLogout={logout}
          />

          <div className="doctor-shell-content">{children}</div>
        </div>

        <DoctorAssistantDrawer
          isOpen={activeOverlay === "assistant"}
          onClose={closeOverlay}
          triggerRef={activeOverlay === "assistant" ? overlayTriggerRef : null}
        />
      </div>
    </DoctorAssistantProvider>
  );
};

export default DoctorDashboardShell;
