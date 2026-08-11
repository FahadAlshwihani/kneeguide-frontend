import React from "react";
import { useTranslation } from "react-i18next";
import "./AvailabilityPicker.css";

/**
 * Real clinician availability — a day rail + a grid of real time-slot
 * buttons (Section 14), never a generic HTML `<input type="date">`/
 * `<input type="time">`. Unavailable slots stay visible (so the patient
 * can see the schedule's actual density) but are real `disabled` buttons,
 * never merely color-dimmed-but-clickable (Section 15) — and they only
 * ever say "Unavailable", never who/why (Section 16).
 *
 * Purely presentational: `availability` (from
 * appointments/patientAppointmentService.js's `getAvailability()`) and
 * the selected date/slot are owned by the caller (AppointmentRequestFlow)
 * so the exact same component can be reused for both the initial request
 * flow and "Choose another time" after rejecting a proposed alternative
 * (Section 27) — one scheduling primitive, not two.
 */
const AvailabilityPicker = ({ availability, selectedDateKey, onSelectDate, selectedSlotKey, onSelectSlot }) => {
  const { t, i18n } = useTranslation();

  const selectedDay = availability.find((day) => day.date.toDateString() === selectedDateKey) || availability[0];

  return (
    <div className="availability-picker">
      <div>
        <p className="availability-picker-label">{t("patientAppointments.request.chooseDate")}</p>
        <ul className="availability-day-rail">
          {availability.map((day) => {
            const dateKey = day.date.toDateString();
            const isSelected = selectedDay && dateKey === selectedDay.date.toDateString();
            const hasAvailability = day.slots.some((slot) => slot.available);
            return (
              <li key={dateKey}>
                <button
                  type="button"
                  className={`availability-day-chip${isSelected ? " availability-day-chip--selected" : ""}`}
                  onClick={() => onSelectDate(dateKey)}
                  disabled={!hasAvailability}
                  aria-pressed={isSelected}
                >
                  <span className="availability-day-chip-weekday">{day.date.toLocaleDateString(i18n.language, { weekday: "short" })}</span>
                  <span className="availability-day-chip-number">{day.date.toLocaleDateString(i18n.language, { day: "numeric" })}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {selectedDay && (
        <div>
          <p className="availability-picker-label">
            {t("patientAppointments.request.chooseTime")}
            {" — "}
            {selectedDay.date.toLocaleDateString(i18n.language, { weekday: "long", month: "short", day: "numeric" })}
          </p>
          <div className="availability-slot-grid" role="group" aria-label={t("patientAppointments.request.chooseTime")}>
            {selectedDay.slots.map((slot) => {
              const slotKey = slot.startAt.toISOString();
              const isSelected = selectedSlotKey === slotKey;
              const timeLabel = slot.startAt.toLocaleTimeString(i18n.language, { hour: "2-digit", minute: "2-digit" });
              return (
                <button
                  key={slotKey}
                  type="button"
                  className={`availability-slot${isSelected ? " availability-slot--selected" : ""}`}
                  disabled={!slot.available}
                  aria-pressed={isSelected}
                  onClick={() => onSelectSlot(slot)}
                >
                  <span dir="ltr">{timeLabel}</span>
                  <span className="availability-slot-status">
                    {slot.available
                      ? isSelected
                        ? t("patientAppointments.request.selected")
                        : t("patientAppointments.request.available")
                      : t("patientAppointments.request.unavailable")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailabilityPicker;
