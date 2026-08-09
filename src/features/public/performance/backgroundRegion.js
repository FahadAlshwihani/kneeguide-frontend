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
//
// Defaults to `false` (assume NOT covering), not `true` — deliberately.
// Grainient's own effect always runs before HeroProblemScene's effect
// (PublicLayout renders Grainient ahead of <Outlet/>, and React fires
// effects children-then-parent, siblings in render order), so whichever
// value sits here at that moment is read *before* HeroProblemScene's own
// IntersectionObserver has had any chance to report the real state.
// Defaulting to "covering" meant a fresh mount could start paused and
// stay that way until some later, unrelated intersection change happened
// to fire a correction — Grainient would render one static frame (via
// its own mount-time setSize() call) and then never start its rAF loop.
// Defaulting to "not covering" means the unresolved window instead only
// ever causes a brief, self-correcting overshoot (animating for a moment
// somewhere Beams also happens to be visible) rather than a silent,
// unbounded undershoot — reliability over a few wasted early frames.
let beamsRegionActive = false;

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
