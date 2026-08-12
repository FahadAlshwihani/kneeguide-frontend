import React, { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuSearch, LuX } from "react-icons/lu";
import { rehabRepository } from "../../../../../domain/rehab/useRehabDomain";
import "./PatientPicker.css";

/**
 * The REAL canonical patient selector (Section 13/39 of the Doctor
 * Appointments brief) — a searchable combobox over the canonical patient
 * roster (rehabRepository.getPatients()), filtered by name / display id /
 * translated diagnosis. Selecting a result stores `patientId`, never a
 * free-text name — this is what the New Appointment composer uses instead
 * of the old free-text `patientName` input.
 */
const PatientPicker = ({ id, label, value, onChange, error, locked = false }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);

  const patients = rehabRepository.getPatients();
  const selected = value ? rehabRepository.getPatient(value) : null;

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return patients;
    return patients.filter((patient) => {
      const diagnosis = t(patient.diagnosisKey).toLowerCase();
      return (
        patient.name.toLowerCase().includes(normalized) ||
        patient.displayId.toLowerCase().includes(normalized) ||
        diagnosis.includes(normalized)
      );
    });
  }, [patients, query, t]);

  const listboxId = `${id}-listbox`;

  const selectPatient = (patient) => {
    onChange(patient.id);
    setQuery("");
    setOpen(false);
    setActiveIndex(-1);
  };

  const clearSelection = () => {
    onChange(null);
    setQuery("");
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (open && activeIndex >= 0 && results[activeIndex]) selectPatient(results[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  if (selected) {
    return (
      <div className="dw-field">
        <label htmlFor={id}>{label}</label>
        <div className="pp-selected-chip">
          <span className="pp-selected-avatar" aria-hidden="true">
            {selected.firstName[0]}
            {selected.lastName[0]}
          </span>
          <div className="pp-selected-text">
            <span className="pp-selected-name" dir="auto">
              {selected.name}
            </span>
            <span className="pp-selected-meta">
              {selected.displayId} · {t(selected.diagnosisKey)}
            </span>
          </div>
          {!locked && (
            <button type="button" className="pp-selected-clear" onClick={clearSelection} aria-label={t("doctorAppointments.composer.patientPicker.change")}>
              <LuX aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="dw-field pp-field">
      <label htmlFor={id}>{label}</label>
      <div className="pp-input-row">
        <LuSearch aria-hidden="true" className="pp-input-icon" />
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          autoComplete="off"
          className="pp-input"
          value={query}
          placeholder={t("doctorAppointments.composer.patientPicker.placeholder")}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActiveIndex(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {open && (
        <ul id={listboxId} role="listbox" className="pp-listbox">
          {results.length === 0 ? (
            <li className="pp-listbox-empty">{t("doctorAppointments.composer.patientPicker.noResults")}</li>
          ) : (
            results.map((patient, index) => (
              <li key={patient.id} role="option" aria-selected={index === activeIndex}>
                <button
                  type="button"
                  className={`pp-option ${index === activeIndex ? "pp-option--active" : ""}`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectPatient(patient)}
                >
                  <span className="pp-option-name" dir="auto">
                    {patient.name}
                  </span>
                  <span className="pp-option-meta">
                    {patient.displayId} · {t(patient.diagnosisKey)}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}

      {error && <p className="dw-field-error">{error}</p>}
    </div>
  );
};

export default PatientPicker;
