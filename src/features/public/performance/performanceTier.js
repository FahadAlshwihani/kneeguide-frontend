// Small, centralized adaptive-performance utility — see the audit report
// this shipped with for why it exists. Everything here is deliberately
// cheap and one-shot: a synchronous hint-based guess at mount, optionally
// refined by a short (~2.5s) runtime frame-rate sample that only ever
// downgrades the hint, never upgrades it, and never runs again after that.
// No permanent FPS monitor, no polling loop.
//
// Consumers should prefer `getPerformanceTier()` (imperative read) or
// `subscribePerformanceTier()` (imperative subscription, e.g. to resize an
// existing WebGL renderer) over re-rendering on every tier change — a tier
// change is rare (at most once per session) and never needs to cascade
// through React state.

const STORAGE_KEY = "kg-perf-tier";
const TIERS = ["low", "medium", "high"];
const SAMPLE_DURATION_MS = 2500;
const MIN_SAMPLE_FRAMES = 20;

const isBrowser = typeof window !== "undefined";

let currentTier = null;
let initPromise = null;
const listeners = new Set();

const notify = () => listeners.forEach((fn) => fn(currentTier));

const readCachedTier = () => {
  if (!isBrowser) return null;
  try {
    const cached = window.sessionStorage?.getItem(STORAGE_KEY);
    return TIERS.includes(cached) ? cached : null;
  } catch {
    return null; // private browsing / storage disabled — fail open, re-hint
  }
};

const writeCachedTier = (tier) => {
  if (!isBrowser) return;
  try {
    window.sessionStorage?.setItem(STORAGE_KEY, tier);
  } catch {
    /* ignore */
  }
};

// Hints only, per the brief — never screen width or user-agent alone.
// Scored rather than branched so no single signal dominates the result.
const computeHintTier = () => {
  if (!isBrowser) return "high";

  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (reducedMotion) return "low";

  if (navigator.connection?.saveData === true) return "low";

  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory; // absent on many browsers — hint only
  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth || 1280;

  let score = 0;
  if (cores >= 8) score += 2;
  else if (cores >= 4) score += 1;

  if (memory === undefined || memory >= 8) score += 2;
  else if (memory >= 4) score += 1;

  if (dpr <= 2) score += 1;
  if (width >= 1024) score += 1;

  if (score >= 5) return "high";
  if (score >= 3) return "medium";
  return "low";
};

// One short, self-terminating rAF loop measuring real frame intervals.
// Resolves `null` (caller keeps the hint tier) if rAF is unavailable or the
// tab is hidden partway through, rather than scoring a stalled/backgrounded
// tab as "low-end hardware".
const sampleFrameIntervals = () =>
  new Promise((resolve) => {
    if (!isBrowser || typeof requestAnimationFrame === "undefined") {
      resolve(null);
      return;
    }

    const intervals = [];
    let last = performance.now();
    const start = last;

    const tick = (now) => {
      if (document.hidden) {
        resolve(null);
        return;
      }
      intervals.push(now - last);
      last = now;
      if (now - start >= SAMPLE_DURATION_MS) {
        resolve(intervals);
        return;
      }
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  });

// Median for the typical case, p75 to catch sustained (not one-off) jank —
// a single dropped frame in an otherwise smooth sample shouldn't demote a
// capable device.
const tierFromIntervals = (intervals) => {
  if (!intervals || intervals.length < MIN_SAMPLE_FRAMES) return null;

  const sorted = [...intervals].sort((a, b) => a - b);
  const medianMs = sorted[Math.floor(sorted.length / 2)];
  const p75Ms = sorted[Math.floor(sorted.length * 0.75)];
  const medianFps = 1000 / medianMs;
  const p75Fps = 1000 / p75Ms;

  if (medianFps >= 55 && p75Fps >= 45) return "high";
  if (medianFps >= 40) return "medium";
  return "low";
};

/**
 * Resolves the session's performance tier — cached hint/sample on repeat
 * calls (including across route navigations within the same tab), so the
 * sample only ever runs once per session. Safe to call from multiple
 * components; they all share the one in-flight promise.
 */
export const initPerformanceTier = () => {
  if (!isBrowser) return Promise.resolve("high");
  if (initPromise) return initPromise;

  const cached = readCachedTier();
  if (cached) {
    currentTier = cached;
    notify();
    initPromise = Promise.resolve(cached);
    return initPromise;
  }

  const hintTier = computeHintTier();
  currentTier = hintTier;
  notify();

  // A device already at the floor, or a backgrounded tab, gets no benefit
  // from spending a runtime sample — commit the hint and stop there.
  if (hintTier === "low" || document.hidden) {
    writeCachedTier(hintTier);
    initPromise = Promise.resolve(hintTier);
    return initPromise;
  }

  initPromise = sampleFrameIntervals().then((intervals) => {
    const sampledTier = tierFromIntervals(intervals);
    // Downgrade-only: a noisy sample can never push the tier above the
    // hint, only confirm it or reveal it was optimistic.
    const finalTier =
      sampledTier && TIERS.indexOf(sampledTier) < TIERS.indexOf(hintTier) ? sampledTier : hintTier;
    currentTier = finalTier;
    writeCachedTier(finalTier);
    notify();
    return finalTier;
  });

  return initPromise;
};

export const getPerformanceTier = () => currentTier || computeHintTier();

export const subscribePerformanceTier = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

const DEFAULT_DPR_CAPS = { high: 2, medium: 1.5, low: 1 };

/**
 * `caps` lets a heavier renderer (e.g. a full-screen 3D shader) apply its
 * own, more conservative ceiling per tier while still sharing the same
 * tier classification — this is what keeps device *detection* centralized
 * without forcing every consumer to accept the same DPR numbers.
 */
export const getDprForTier = (tier = getPerformanceTier(), caps = DEFAULT_DPR_CAPS) => {
  if (!isBrowser) return 1;
  const cap = caps[tier] ?? caps.high ?? DEFAULT_DPR_CAPS.high;
  return Math.min(window.devicePixelRatio || 1, cap);
};

if (isBrowser && process.env.NODE_ENV !== "production") {
  window.__KG_PERF__ = window.__KG_PERF__ || {};
  Object.assign(window.__KG_PERF__, {
    get tier() {
      return getPerformanceTier();
    },
    getDprForTier,
  });
}
