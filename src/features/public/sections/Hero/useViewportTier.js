import { useState, useEffect } from "react";

const TIERS = [
  { name: "ultrawide", minWidth: 1600, cardCount: 9 },
  { name: "desktop", minWidth: 1200, cardCount: 7 },
  { name: "laptop", minWidth: 992, cardCount: 6 },
  { name: "tablet", minWidth: 640, cardCount: 4 },
  { name: "mobile", minWidth: 0, cardCount: 1 },
];

const getTier = (width, height) => {
  const base = TIERS.find((tier) => width >= tier.minWidth) || TIERS[TIERS.length - 1];

  // The Hero must always fit within one viewport — on short viewports
  // (small laptop windows, browser chrome eating into height) trim the
  // count further so the grid never forces a scroll. Width tier still
  // decides the base "how many cards make sense at this width".
  let cardCount = base.cardCount;
  if (base.name !== "mobile" && height) {
    if (height < 640) cardCount = Math.max(1, cardCount - 2);
    else if (height < 780) cardCount = Math.max(1, cardCount - 1);
  }

  return { name: base.name, cardCount };
};

/**
 * Resize-aware viewport tier for the Hero's dashboard-card composition.
 * Returns how many cards to show at the current viewport — count only,
 * layout/positions stay CSS-driven.
 */
const useViewportTier = () => {
  const [tier, setTier] = useState(() =>
    getTier(
      typeof window !== "undefined" ? window.innerWidth : 1280,
      typeof window !== "undefined" ? window.innerHeight : 800
    )
  );

  useEffect(() => {
    let frame = null;
    const handleResize = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        setTier((current) => {
          const next = getTier(window.innerWidth, window.innerHeight);
          return next.name === current.name && next.cardCount === current.cardCount
            ? current
            : next;
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
