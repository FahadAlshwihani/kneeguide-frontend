import React from "react";
import "./SegmentedControl.css";

/**
 * Small, accessible segmented control for Preferences (Section 45/46) —
 * language `[English][العربية]` and appearance `[System][Light][Dark]`.
 * Built as a native `role="radiogroup"` of real `role="radio"` buttons
 * (keyboard-operable, `aria-checked` conveys state without relying on
 * color alone — Section 36) rather than a plain `<select>`, since the
 * task explicitly asks for a polished selector while also warning not to
 * overbuild it — this is the smallest control that is both accessible and
 * visually intentional, no decorative previews/animation beyond the
 * existing `--patient-transition-*` tokens already used everywhere else.
 */
const SegmentedControl = ({ legend, options, value, onChange, name }) => (
  <fieldset className="pfl-segmented" role="radiogroup" aria-label={legend}>
    {options.map((option) => {
      const checked = option.value === value;
      return (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={checked}
          className={`pfl-segmented-option${checked ? " pfl-segmented-option--active" : ""}`}
          onClick={() => onChange(option.value)}
          name={name}
        >
          {option.icon && (
            <span className="pfl-segmented-icon" aria-hidden="true">
              {option.icon}
            </span>
          )}
          <span>{option.label}</span>
        </button>
      );
    })}
  </fieldset>
);

export default SegmentedControl;
