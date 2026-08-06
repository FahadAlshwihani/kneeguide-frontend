import { useEffect, useRef, useState } from "react";

const DEFAULT_THRESHOLD = 0.2;
const DEFAULT_ROOT_MARGIN = "0px 0px -10% 0px";

// One IntersectionObserver per distinct (threshold, rootMargin) pair,
// shared by every component that requests that pair — never one
// observer per animated element. Almost everyone uses the defaults, so
// in practice the whole site shares a single observer instance.
const observerPool = new Map();

const getSharedObserver = (threshold, rootMargin) => {
  const key = `${threshold}|${rootMargin}`;
  let entry = observerPool.get(key);
  if (entry) return { ...entry, key };

  const callbacks = new Map(); // target element -> (isIntersecting) => void

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((intersectionEntry) => {
        callbacks.get(intersectionEntry.target)?.(intersectionEntry.isIntersecting);
      });
    },
    { threshold, rootMargin }
  );

  entry = { observer, callbacks };
  observerPool.set(key, entry);
  return { ...entry, key };
};

/**
 * The shared reveal primitive for the whole site — see RevealSection for
 * the ready-to-use component built on top of this. Tracks a single
 * element's viewport intersection via a pooled, shared
 * IntersectionObserver (never a new observer per element) and returns a
 * plain visible/not-visible flag. By default it's repeatable — flips
 * back to false when the element leaves the viewport, true again when it
 * re-enters — pass `once: true` for the traditional "reveal and stay"
 * behavior instead.
 *
 * No scroll listeners, no requestAnimationFrame loop: the browser's own
 * IntersectionObserver does the work, this just relays its result into
 * React state.
 */
export const useSectionReveal = ({
  threshold = DEFAULT_THRESHOLD,
  rootMargin = DEFAULT_ROOT_MARGIN,
  once = false,
} = {}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);
  const hasRevealedRef = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    if (typeof IntersectionObserver === "undefined") {
      // No IO support: fail open rather than leaving the section stuck
      // invisible.
      setIsVisible(true);
      return undefined;
    }

    const { observer, callbacks, key } = getSharedObserver(threshold, rootMargin);

    callbacks.set(node, (intersecting) => {
      if (once) {
        if (intersecting && !hasRevealedRef.current) {
          hasRevealedRef.current = true;
          setIsVisible(true);
        }
        return;
      }
      setIsVisible(intersecting);
    });

    observer.observe(node);

    return () => {
      callbacks.delete(node);
      observer.unobserve(node);
      if (callbacks.size === 0) {
        observer.disconnect();
        observerPool.delete(key);
      }
    };
  }, [threshold, rootMargin, once]);

  return { ref, isVisible };
};

export default useSectionReveal;
