import { useEffect, useState } from "react";

// >=1200px comfortably fits 3 columns of the widened KPI cards (this
// component's own max-width caps the grid around 1150px, so 3 columns
// land close to ~360px each — well above their real minimum readable
// width) without cramping. Standard iPad landscape (1024px) and iPad
// Air 11" landscape (1180px) both fall under this, correctly landing in
// "tablet" (2-card) mode. iPad Pro 12.9" landscape (1366px) reports the
// same CSS viewport width as a 1366px laptop — no width-only media query
// can tell those apart, so that one specific device/orientation combo
// gets the desktop 6-card treatment; a deliberate, documented tradeoff,
// not an oversight.
const DESKTOP_QUERY = "(min-width: 1200px)";
// Matches the mobile breakpoint already used throughout this homepage
// (Problem/Solution/Roadmap/etc.), not a new number invented for this
// component.
const MOBILE_QUERY = "(max-width: 767px)";

const computeMode = () => {
  if (typeof window === "undefined") return "desktop";
  if (window.matchMedia(MOBILE_QUERY).matches) return "mobile";
  if (window.matchMedia(DESKTOP_QUERY).matches) return "desktop";
  return "tablet";
};

/**
 * Desktop / tablet / mobile, driven by `matchMedia` + its own `change`
 * event — never a raw `resize` listener, so this only re-renders on an
 * actual breakpoint crossing, not on every pixel of a dragged window
 * resize. Same technique ScrollStack's own `useIsDesktop` already uses
 * elsewhere on this site, kept local here rather than imported since that
 * module is a single boolean, not a three-way mode, and is otherwise
 * off-limits to touch.
 */
const useHeroResponsiveMode = () => {
  const [mode, setMode] = useState(computeMode);

  useEffect(() => {
    const desktopMql = window.matchMedia(DESKTOP_QUERY);
    const mobileMql = window.matchMedia(MOBILE_QUERY);

    const update = () => {
      if (mobileMql.matches) setMode("mobile");
      else if (desktopMql.matches) setMode("desktop");
      else setMode("tablet");
    };

    update();
    desktopMql.addEventListener("change", update);
    mobileMql.addEventListener("change", update);
    return () => {
      desktopMql.removeEventListener("change", update);
      mobileMql.removeEventListener("change", update);
    };
  }, []);

  return mode;
};

export default useHeroResponsiveMode;
