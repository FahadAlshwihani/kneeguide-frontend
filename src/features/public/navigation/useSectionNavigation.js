import { useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const scrollToId = (id) => {
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  return true;
};

/**
 * Small shared helper behind every public marketing navigation link
 * (Header mega-menu, Footer columns, both brand logos) — see
 * publicNavigation.js for the canonical destination list. Every
 * destination is a homepage section id, navigated to as `/#id` through
 * react-router's own `navigate()` (never a raw location.hash write) so
 * back/forward and same-route hash-only updates stay in sync with
 * react-router's history.
 *
 * `goToSection`/`goHome` only ever change the URL (plus the couple of
 * cases below where the target is already on screen and no location
 * change would occur). `useHomeSectionScroll` is the other half — it
 * owns the actual scrolling, reacting to whatever the URL's hash ends up
 * being regardless of how it got there (same-page click, cross-route
 * navigation, or a direct/refreshed `/#id` load).
 */
export const useSectionNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const goToSection = useCallback(
    (id) => {
      const hash = `#${id}`;
      if (location.pathname === "/" && location.hash === hash) {
        // Hash already matches — navigate() wouldn't produce a location
        // change to react to, so scroll directly. Covers re-clicking the
        // current section after the user has manually scrolled away.
        scrollToId(id);
        return;
      }
      navigate(`/${hash}`);
    },
    [location.pathname, location.hash, navigate]
  );

  const goHome = useCallback(() => {
    if (location.pathname === "/") {
      if (location.hash) navigate("/");
      window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
      return;
    }
    navigate("/");
  }, [location.pathname, location.hash, navigate]);

  return { goToSection, goHome };
};

/**
 * Mounted once by HomePage. Two independent effects on purpose:
 *
 * - "has hash": scrolls the matching section into view, deferred one
 *   animation frame so it always runs after that section's DOM node
 *   exists — covers a direct/refreshed `/#id` load and a cross-route
 *   `goToSection` arrival, and also re-fires for same-page hash changes
 *   (clicking between sections while already on the homepage).
 * - "no hash, mount only": lands at the top instantly. Covers a plain
 *   `/` load and a cross-route `goHome` arrival. Deliberately does not
 *   depend on location.hash — it must run once per mount and never
 *   again, since the "hash cleared while already home" case is handled
 *   synchronously inside goHome itself.
 */
export const useHomeSectionScroll = () => {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return undefined;
    const id = location.hash.slice(1);
    const frame = requestAnimationFrame(() => scrollToId(id));
    return () => cancelAnimationFrame(frame);
  }, [location.hash]);

  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
