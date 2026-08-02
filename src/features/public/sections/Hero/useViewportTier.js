import { useState, useEffect } from "react";

// Width tier sets the *ceiling* on card count — how much depth/richness
// the preview could show at this screen width. HeroDashboardPreview then
// measures the actual (height-constrained) box it's given and trims that
// ceiling down further if needed, so the real on-screen count is always
// whatever fits without cropping, never just this table's number.
const TIERS = [
  { name: "ultrawide", minWidth: 1600, cardCount: 10 },
  { name: "desktop", minWidth: 1200, cardCount: 8 },
  { name: "laptop", minWidth: 992, cardCount: 6 },
  { name: "tablet", minWidth: 640, cardCount: 4 },
  { name: "mobile", minWidth: 0, cardCount: 1 },
];

const getTier = (width) => TIERS.find((tier) => width >= tier.minWidth) || TIERS[TIERS.length - 1];

/**
 * Resize-aware viewport tier for the Hero's dashboard-card composition.
 * Returns how many cards to show at the current viewport — count only,
 * layout/positions stay CSS-driven.
 */
const useViewportTier = () => {
  const [tier, setTier] = useState(() =>
    getTier(typeof window !== "undefined" ? window.innerWidth : 1280)
  );

  useEffect(() => {
    let frame = null;
    const handleResize = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        setTier((current) => {
          const next = getTier(window.innerWidth);
          return next.name === current.name ? current : next;
        });
      });
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return tier;
};

export default useViewportTier;
