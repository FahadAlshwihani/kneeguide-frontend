import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { animate, useInView } from "motion/react";
import { FaClipboardList, FaCommentSlash, FaChartLine } from "react-icons/fa6";
import Reveal from "../../components/Reveal";
import TextType from "../../components/TextType";
import "./Problem.css";

const STAT_KEYS = ["adherence", "dropout", "followup"];

const CARD_ICONS = [FaClipboardList, FaCommentSlash, FaChartLine];
const CARD_KEYS = ["exercises", "pain", "decisions"];

const AUDIENCE_WORD_KEYS = ["patients", "clinicians", "teams"];
// All three within the brand's existing blue family — never black, never
// a color outside the palette already defined in index.css.
const AUDIENCE_WORD_COLORS = ["var(--color-primary)", "var(--color-accent)", "var(--color-primary-hover)"];

// "95%" / "40%" / "3x" (or "3×" in Arabic) -> { target: 95, suffix: "%" }.
// Keeps the animation driven by the real translated string instead of a
// second, separately-maintained numeric constant that could drift from it.
const parseStatValue = (raw) => {
  const match = /^(\d+(?:\.\d+)?)(.*)$/.exec(String(raw).trim());
  if (!match) return { target: 0, suffix: raw };
  return { target: parseFloat(match[1]), suffix: match[2] };
};

// Counts up from 0 to the stat's real value once the row scrolls into
// view — never again after that (useInView's `once: true`, plus a ref
// guard against StrictMode's double-invoke re-triggering it). `active`
// only ever flips false -> true, so there's no path back to 0.
const AnimatedStatValue = ({ raw, active }) => {
  const { target, suffix } = parseStatValue(raw);
  const [display, setDisplay] = useState(0);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (!active || hasAnimatedRef.current) return undefined;
    hasAnimatedRef.current = true;

    const controls = animate(0, target, {
      duration: 1.8,
      ease: "easeOut",
      onUpdate: (value) => setDisplay(Math.round(value)),
    });

    return () => controls.stop();
  }, [active, target]);

  return (
    <span className="problem-stat-value">
      {display}
      {suffix}
    </span>
  );
};

const Problem = () => {
  const { t, i18n } = useTranslation();
  const statsRowRef = useRef(null);
  const isStatsRowInView = useInView(statsRowRef, { once: true, amount: 0.5 });

  const audienceWords = AUDIENCE_WORD_KEYS.map((key) => t(`publicProblem.audience.${key}`));

  // "Designed for" must never move, no matter how short/long the current
  // word is — so the animated word doesn't just flow inline, it sits in a
  // slot sized to the *widest* of the three words (measured for real,
  // never estimated), and only that slot's own content changes width as
  // TextType types/deletes. `.problem-audience-measure` renders all three
  // words off-screen in the exact same font so the measurement always
  // matches what's actually on screen — including its clamp()'d,
  // viewport-relative font-size, which is why this re-measures on resize
  // too, not just once on mount.
  const measureRef = useRef(null);
  const [wordSlotWidth, setWordSlotWidth] = useState(null);

  useLayoutEffect(() => {
    const node = measureRef.current;
    if (!node) return undefined;
    const children = Array.from(node.children);
    if (!children.length) return undefined;

    const measure = () => {
      const widest = Math.max(0, ...children.map((child) => child.getBoundingClientRect().width));
      setWordSlotWidth(widest);
    };

    measure();

    let observer;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(measure);
      children.forEach((child) => observer.observe(child));
    } else {
      window.addEventListener("resize", measure);
    }

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audienceWords.join("|")]);

  return (
    <section className="problem-root" id="challenge">
      <div className="problem-container">
        {/* 1. Projected impact statistics — first element, before the badge/title/description. */}
        <Reveal className="problem-stats">
          <p className="problem-stats-eyebrow">{t("publicProblem.stats.eyebrow")}</p>
          <div className="problem-stats-row" ref={statsRowRef}>
            {STAT_KEYS.map((key) => (
              <div className="problem-stat" key={key}>
                <AnimatedStatValue raw={t(`publicProblem.stats.${key}Value`)} active={isStatsRowInView} />
                <span className="problem-stat-label">{t(`publicProblem.stats.${key}Label`)}</span>
              </div>
            ))}
          </div>
        </Reveal>

        {/* 2. Designed-for audience statement — the prefix and the
            animated word are two independent flex items (never the same
            inline text run), so nothing about the word's own content can
            ever move the prefix — see .problem-audience-line. */}
        <Reveal as="div" className="problem-audience" delay={0.05}>
          <div className="problem-audience-line">
            <span className="problem-audience-lead">{t("publicProblem.audience.lead")}</span>
            <span
              className="problem-audience-word-slot"
              style={wordSlotWidth ? { width: wordSlotWidth } : undefined}
            >
              <TextType
                key={i18n.language}
                as="span"
                className="problem-audience-word"
                text={audienceWords}
                textColors={AUDIENCE_WORD_COLORS}
                typingSpeed={65}
                deletingSpeed={35}
                pauseDuration={1800}
                variableSpeed={{ min: 45, max: 90 }}
                loop
                startOnVisible
                showCursor
                hideCursorWhileTyping={false}
                cursorCharacter="|"
              />
            </span>
          </div>
          {/* Off-screen twin of the three words, in the exact same font,
              purely so wordSlotWidth can measure real rendered widths
              instead of guessing them. */}
          <span className="problem-audience-measure" ref={measureRef} aria-hidden="true">
            {audienceWords.map((word) => (
              <span className="problem-audience-word" key={word}>
                {word}
              </span>
            ))}
          </span>
        </Reveal>

        {/* 3. Section badge, title and description. */}
        <Reveal className="problem-header" delay={0.1}>
          <span className="problem-badge">{t("publicProblem.badge")}</span>
          <h2 className="problem-title">{t("publicProblem.title")}</h2>
          <p className="problem-description">{t("publicProblem.description")}</p>
        </Reveal>

        {/* 4. The only elements in this section allowed to look like cards. */}
        <div className="problem-grid">
          {CARD_KEYS.map((key, index) => {
            const Icon = CARD_ICONS[index];
            return (
              <Reveal as="div" key={key} delay={0.15 + index * 0.1} className="problem-card">
                <span className="problem-card-icon">
                  <Icon aria-hidden="true" />
                </span>
                <h3 className="problem-card-title">{t(`publicProblem.cards.${key}Title`)}</h3>
                <p className="problem-card-description">{t(`publicProblem.cards.${key}Description`)}</p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Problem;
