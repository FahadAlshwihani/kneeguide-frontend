import { LuPanelLeftClose, LuPanelLeftOpen, LuPanelRightClose, LuPanelRightOpen } from "react-icons/lu";

/**
 * Shared between Patient and Doctor conversation-history rails
 * (components/PatientConversationHistory.jsx and doctor/components/
 * assistant/DoctorConversationHistory.jsx) — genuinely the same problem in
 * both: each renders its history rail as the FIRST child of a row-
 * direction flex container, positioned by normal document flow (never
 * fixed/`inset-inline-start` positioning), so the rail's actual physical
 * side flips with direction on its own — left in LTR, right in RTL.
 *
 * Lucide's PanelLeft-family and PanelRight-family icons are literal fixed artwork (not
 * auto-mirrored by `dir`), so picking "PanelLeft" unconditionally — what
 * both components did before this fix — draws a left-side panel glyph even
 * when the rail is actually sitting on the right in RTL, which reads as
 * backwards. This function is the ONE place that maps
 * `{ physical side, collapsed/expanded state }` to the icon that actually
 * describes the click's result; it renders nothing and owns no state.
 *
 * `isCollapsed` describes the CURRENT state — the returned icon always
 * represents the ACTION the button performs (collapsed -> shows an "open"
 * glyph pointing where the rail will expand to; expanded -> shows a
 * "close" glyph pointing where the rail will retract to).
 */
export const getSidebarToggleIcon = ({ isRTL, isCollapsed }) => {
  if (isRTL) {
    return isCollapsed ? LuPanelRightOpen : LuPanelRightClose;
  }
  return isCollapsed ? LuPanelLeftOpen : LuPanelLeftClose;
};
