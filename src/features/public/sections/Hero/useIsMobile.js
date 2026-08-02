import { useState, useEffect } from "react";

// The one deliberate, explicit breakpoint left in this preview: below it,
// the preview always shows exactly one (randomly chosen) card, per product
// decision — never 2, never 3. It matches the CSS grid's own mobile
// collapse in HeroDashboardPreview.css. Everything above it is measured,
// not bucketed — see HeroDashboardPreview.jsx's fit loop.
const MOBILE_MAX_WIDTH = 640;

/**
 * True below the mobile breakpoint. Used only to gate the "always exactly
 * one card" rule — desktop/tablet card counts come from measuring the
 * preview's actual box, not from width thresholds.
 */
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < MOBILE_MAX_WIDTH : false
  );

  useEffect(() => {
    let frame = null;
    const handleResize = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        setIsMobile(window.innerWidth < MOBILE_MAX_WIDTH);
      });
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return isMobile;
};

export default useIsMobile;
