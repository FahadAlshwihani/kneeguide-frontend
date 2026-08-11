import React from "react";
import { useTranslation } from "react-i18next";
import { LuCheck } from "react-icons/lu";
import { REHAB_DAY_STATUS } from "../../data/patientRehabPlanData";
import "./RehabDayRail.css";

/**
 * The rehab week timeline — a horizontally-scrollable rail of day chips,
 * deliberately NOT a calendar grid (Section 3's own "this is a rehab
 * timeline, not a calendar application" direction). Native horizontal
 * scroll + logical CSS properties (RehabDayRail.css) means this needs no
 * separate RTL layout branch — the browser reverses scroll/reading order
 * on its own under `dir="rtl"`.
 *
 * Weekday/day-of-month labels come from `Intl`/`toLocaleDateString` with
 * the ACTIVE UI LOCALE (not the exercise catalog's translation keys),
 * exactly like the rest of the app already does for genuinely calendar-
 * shaped data — no hardcoded English weekday strings, no new translation
 * keys needed just to say "Mon"/"Tue" in Arabic.
 *
 * Upcoming days are visible but not falsely presented as available to
 * start (see RehabDayRail.css / SessionHero.jsx's own "Available on..."
 * messaging) — selecting one only shows a PREVIEW, never an active
 * session.
 */
const RehabDayRail = ({ days, selectedDayId, onSelect, todayCompleted, weekLabel }) => {
  const { t, i18n } = useTranslation();

  return (
    <nav className="rehab-day-rail" aria-label={t("patientExercises.session.weekNav")}>
      <p className="rehab-day-rail-label">{weekLabel}</p>
      <ul className="rehab-day-rail-list">
        {days.map((day) => {
          const isSelected = day.id === selectedDayId;
          const isCompleted = day.status === REHAB_DAY_STATUS.COMPLETED || (day.status === REHAB_DAY_STATUS.TODAY && todayCompleted);
          const isToday = day.status === REHAB_DAY_STATUS.TODAY;

          const weekdayLabel = day.date.toLocaleDateString(i18n.language, { weekday: "short" });
          const dayNumberLabel = day.date.toLocaleDateString(i18n.language, { day: "numeric" });

          let statusText = t("patientExercises.session.dayStatus.upcoming");
          if (isToday) statusText = todayCompleted ? t("patientExercises.session.dayStatus.completed") : t("patientExercises.session.dayStatus.today");
          else if (isCompleted) statusText = t("patientExercises.session.dayStatus.completed");

          return (
            <li key={day.id}>
              <button
                type="button"
                className={[
                  "rehab-day-chip",
                  isSelected && "rehab-day-chip--selected",
                  isToday && "rehab-day-chip--today",
                  isCompleted && "rehab-day-chip--completed",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => onSelect(day.id)}
                aria-current={isSelected ? "true" : undefined}
              >
                <span className="rehab-day-chip-weekday">{weekdayLabel}</span>
                <span className="rehab-day-chip-number">{dayNumberLabel}</span>
                <span className="rehab-day-chip-status">
                  {isCompleted && <LuCheck aria-hidden="true" />}
                  <span>{statusText}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default RehabDayRail;
