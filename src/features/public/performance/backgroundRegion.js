// Beams and Grainient are two separate full-bleed WebGL backgrounds that
// happen to share one continuous scroll: Beams behind Hero/Problem/
// Solution, Grainient behind everything from ScrollStackFeature down. This
// is the one signal that lets Grainient know when Beams' opaque canvas is
// currently covering the viewport, so it can skip rendering frames nobody
// can see rather than relying on its own (page-spanning) container's
// IntersectionObserver, which is intersecting almost everywhere.
//
// Plain module-level pub/sub, not React state/context — publishing this on
// every scroll-driven intersection change must never trigger a React
// re-render anywhere in the tree. HeroProblemScene is the sole publisher
// (it already runs an IntersectionObserver for its own Beams pause/resume
// logic; this just taps that same callback). Grainient is the sole
// subscriber, using it only to gate its own rAF loop.
let beamsRegionActive = true; // matches the page's actual scroll position on load

const listeners = new Set();

export const setBeamsRegionActive = (active) => {
  if (beamsRegionActive === active) return;
  beamsRegionActive = active;
  listeners.forEach((fn) => fn(beamsRegionActive));
};

export const isBeamsRegionActive = () => beamsRegionActive;

export const subscribeBeamsRegion = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
