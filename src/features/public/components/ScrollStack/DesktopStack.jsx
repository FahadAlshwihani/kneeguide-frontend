import { useLayoutEffect, useRef, useCallback } from "react";
import Lenis from "lenis";
import "./ScrollStack.css";

/**
 * Purpose-built desktop scroll-stack engine — not a ReactBits port.
 *
 * The jittery version measured each card's position via a fresh
 * getBoundingClientRect() every single scroll frame, on a card that
 * already had a transform applied from the previous frame. That's
 * self-referential: last frame's translateY leaks into this frame's
 * "natural position" read, and the trigger/pin math drifts frame over
 * frame under continuous scroll.
 *
 * This engine measures each card's natural top exactly once — via
 * offsetTop, which the `transform` property never affects (it's a
 * layout-box value, not a paint-box one), so it can't be contaminated by
 * whatever translateY/scale this engine itself last wrote. That cached
 * baseline, not a live re-measurement, is what every frame's stacking
 * math reads from. It's only ever recomputed on an actual layout change
 * (resize, font load, RTL flip, content reflow), never mid-scroll.
 *
 * The visual formulas (trigger points, pin range, translateY/scale/
 * rotation) are otherwise the same shape as the reference implementation
 * — same overlap, same release feel — only where "the card's top" comes
 * from has changed.
 */
const DesktopStack = ({
  children,
  className = "",
  itemDistance = 100,
  itemScale = 0.03,
  itemStackDistance = 30,
  stackPosition = "20%",
  scaleEndPosition = "10%",
  baseScale = 0.85,
  rotationAmount = 0,
  blurAmount = 0,
  onStackComplete,
}) => {
  const scrollerRef = useRef(null);
  const cardsRef = useRef([]);
  const endElementRef = useRef(null);
  const cardBaseTopsRef = useRef([]);
  const endBaseTopRef = useRef(0);
  const lastTransformsRef = useRef(new Map());
  const stackCompletedRef = useRef(false);
  const isUpdatingRef = useRef(false);
  const rafRef = useRef(null);
  const lenisRef = useRef(null);
  const measurementFrameRef = useRef(null);
  const updateTransformsRef = useRef(null);

  const parsePercentage = useCallback((value, containerHeight) => {
    if (typeof value === "string" && value.includes("%")) {
      return (parseFloat(value) / 100) * containerHeight;
    }
    return parseFloat(value);
  }, []);

  const calculateProgress = useCallback((scrollTop, start, end) => {
    if (scrollTop < start) return 0;
    if (scrollTop > end) return 1;
    return (scrollTop - start) / (end - start);
  }, []);

  // The only DOM box-geometry read anywhere in this file. It targets the
  // scroller, which this engine never writes a transform to, so the read
  // is always clean — never contaminated by our own animation output.
  const measureBaselines = useCallback(() => {
    const scroller = scrollerRef.current;
    const cards = cardsRef.current;
    const endElement = endElementRef.current;
    if (!scroller || !cards.length || !endElement) return;

    const scrollerTop = scroller.getBoundingClientRect().top + window.scrollY;
    cardBaseTopsRef.current = cards.map((card) => scrollerTop + card.offsetTop);
    endBaseTopRef.current = scrollerTop + endElement.offsetTop;
  }, []);

  const scheduleMeasurement = useCallback(() => {
    if (measurementFrameRef.current !== null) return;

    measurementFrameRef.current = requestAnimationFrame(() => {
      measurementFrameRef.current = null;
      measureBaselines();
      updateTransformsRef.current?.();
    });
  }, [measureBaselines]);

  const updateTransforms = useCallback(() => {
    const cards = cardsRef.current;
    if (!cards.length || isUpdatingRef.current) return;

    isUpdatingRef.current = true;

    const scrollTop = window.scrollY;
    const containerHeight = window.innerHeight;
    const stackPositionPx = parsePercentage(stackPosition, containerHeight);
    const scaleEndPositionPx = parsePercentage(scaleEndPosition, containerHeight);
    const cardTops = cardBaseTopsRef.current;
    const endTop = endBaseTopRef.current;

    let topCardIndex = 0;
    if (blurAmount) {
      cardTops.forEach((cardTop, j) => {
        const jTriggerStart = cardTop - stackPositionPx - itemStackDistance * j;
        if (scrollTop >= jTriggerStart) {
          topCardIndex = j;
        }
      });
    }

    cards.forEach((card, i) => {
      const cardTop = cardTops[i];
      if (cardTop === undefined) return;

      const triggerStart = cardTop - stackPositionPx - itemStackDistance * i;
      const triggerEnd = cardTop - scaleEndPositionPx;
      const pinStart = triggerStart;
      const pinEnd = endTop - containerHeight / 2;

      const scaleProgress = calculateProgress(scrollTop, triggerStart, triggerEnd);
      const targetScale = baseScale + i * itemScale;
      const scale = 1 - scaleProgress * (1 - targetScale);
      const rotation = rotationAmount ? i * rotationAmount * scaleProgress : 0;

      let blur = 0;
      if (blurAmount && i < topCardIndex) {
        const depthInStack = topCardIndex - i;
        blur = Math.max(0, depthInStack * blurAmount);
      }

      let translateY = 0;
      const isPinned = scrollTop >= pinStart && scrollTop <= pinEnd;

      if (isPinned) {
        translateY = scrollTop - cardTop + stackPositionPx + itemStackDistance * i;
      } else if (scrollTop > pinEnd) {
        translateY = pinEnd - cardTop + stackPositionPx + itemStackDistance * i;
      }

      const nextTransform = {
        translateY: Math.round(translateY * 100) / 100,
        scale: Math.round(scale * 1000) / 1000,
        rotation: Math.round(rotation * 100) / 100,
        blur: Math.round(blur * 100) / 100,
      };

      const lastTransform = lastTransformsRef.current.get(i);
      const hasChanged =
        !lastTransform ||
        Math.abs(lastTransform.translateY - nextTransform.translateY) > 0.1 ||
        Math.abs(lastTransform.scale - nextTransform.scale) > 0.001 ||
        Math.abs(lastTransform.rotation - nextTransform.rotation) > 0.1 ||
        Math.abs(lastTransform.blur - nextTransform.blur) > 0.1;

      if (hasChanged) {
        card.style.transform = `translate3d(0, ${nextTransform.translateY}px, 0) scale(${nextTransform.scale}) rotate(${nextTransform.rotation}deg)`;
        if (blurAmount) {
          card.style.filter = nextTransform.blur > 0 ? `blur(${nextTransform.blur}px)` : "";
        }

        lastTransformsRef.current.set(i, nextTransform);
      }

      if (i === cards.length - 1) {
        const isInView = scrollTop >= pinStart && scrollTop <= pinEnd;
        if (isInView && !stackCompletedRef.current) {
          stackCompletedRef.current = true;
          onStackComplete?.();
        } else if (!isInView && stackCompletedRef.current) {
          stackCompletedRef.current = false;
        }
      }
    });

    isUpdatingRef.current = false;
  }, [
    itemScale,
    itemStackDistance,
    stackPosition,
    scaleEndPosition,
    baseScale,
    rotationAmount,
    blurAmount,
    onStackComplete,
    calculateProgress,
    parsePercentage,
  ]);

  updateTransformsRef.current = updateTransforms;

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const cards = Array.from(document.querySelectorAll(".scroll-stack-card"));
    cardsRef.current = cards;
    endElementRef.current = scroller.querySelector(".scroll-stack-end");
    const transformsCache = lastTransformsRef.current;

    cards.forEach((card, i) => {
      if (i < cards.length - 1) {
        card.style.marginBottom = `${itemDistance}px`;
      }
      card.style.willChange = blurAmount ? "transform, filter" : "transform";
      card.style.transformOrigin = "top center";
      card.style.backfaceVisibility = "hidden";
      card.style.transform = "translateZ(0)";
      card.style.webkitTransform = "translateZ(0)";
      card.style.perspective = "1000px";
      card.style.webkitPerspective = "1000px";
    });

    measureBaselines();

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 2,
      infinite: false,
      wheelMultiplier: 1,
      lerp: 0.1,
      syncTouch: true,
      syncTouchLerp: 0.075,
    });
    lenis.on("scroll", updateTransforms);

    const raf = (time) => {
      lenis.raf(time);
      rafRef.current = requestAnimationFrame(raf);
    };
    rafRef.current = requestAnimationFrame(raf);
    lenisRef.current = lenis;

    updateTransforms();

    const resizeObserver =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(scheduleMeasurement);
    resizeObserver?.observe(scroller);
    resizeObserver?.observe(scroller.querySelector(".scroll-stack-inner"));
    cards.forEach((card) => resizeObserver?.observe(card));

    window.addEventListener("resize", scheduleMeasurement);
    window.addEventListener("orientationchange", scheduleMeasurement);
    const languageObserver = new MutationObserver(scheduleMeasurement);
    languageObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["lang", "dir"],
    });

    let isMounted = true;
    document.fonts?.ready.then(() => {
      if (isMounted) scheduleMeasurement();
    });
    document.fonts?.addEventListener?.("loadingdone", scheduleMeasurement);

    return () => {
      isMounted = false;
      resizeObserver?.disconnect();
      languageObserver.disconnect();
      document.fonts?.removeEventListener?.("loadingdone", scheduleMeasurement);
      window.removeEventListener("resize", scheduleMeasurement);
      window.removeEventListener("orientationchange", scheduleMeasurement);
      if (measurementFrameRef.current !== null) {
        cancelAnimationFrame(measurementFrameRef.current);
        measurementFrameRef.current = null;
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (lenisRef.current) {
        lenisRef.current.destroy();
      }
      stackCompletedRef.current = false;
      cardsRef.current = [];
      endElementRef.current = null;
      cardBaseTopsRef.current = [];
      endBaseTopRef.current = 0;
      transformsCache.clear();
      isUpdatingRef.current = false;
    };
  }, [
    itemDistance,
    itemScale,
    itemStackDistance,
    stackPosition,
    scaleEndPosition,
    baseScale,
    rotationAmount,
    blurAmount,
    onStackComplete,
    updateTransforms,
    measureBaselines,
    scheduleMeasurement,
  ]);

  return (
    <div className={`scroll-stack-scroller ${className}`.trim()} ref={scrollerRef}>
      <div className="scroll-stack-inner">
        {children}
        {/* Spacer so the last pin can release cleanly */}
        <div className="scroll-stack-end" />
      </div>
    </div>
  );
};

export default DesktopStack;
