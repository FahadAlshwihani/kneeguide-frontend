import React, { useEffect, useRef, useState } from "react";
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
// Patients -> primary blue, Clinicians -> dark text, Healthcare Teams ->
// a slightly lighter blue — all three already-existing brand tokens
// (index.css), never new colors.
const AUDIENCE_WORD_COLORS = ["var(--color-primary)", "var(--problem-heading)", "var(--color-accent)"];

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
  const { t } = useTranslation();
  const statsRowRef = useRef(null);
  const isStatsRowInView = useInView(statsRowRef, { once: true, amount: 0.5 });

  const audienceWords = AUDIENCE_WORD_KEYS.map((key) => t(`publicProblem.audience.${key}`));

  return (
    <section className="problem-root">
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

        {/* 2. Designed-for audience statement — one sentence, only the
            last word changes; "Designed for" / "مصمم" stays put. */}
        <Reveal as="div" className="problem-audience" delay={0.05}>
          <span className="problem-audience-lead">{t("publicProblem.audience.lead")}</span>{" "}
          <TextType
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
            showCursor={false}
          />
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
