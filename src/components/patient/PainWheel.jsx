// src/components/patient/PainWheel.jsx
import React, { useRef, useState, useEffect } from "react";
import "../../styles/PainWheel.css";
import { useTranslation } from "react-i18next";

const PainWheel = ({ value = 0, onChange }) => {
  const { t } = useTranslation();
  const [dragging, setDragging] = useState(false);
  const wheelRef = useRef(null);

  const clamp = (v) => Math.min(10, Math.max(0, v));

  const handlePointer = (clientX, clientY) => {
    if (!wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const x = clientX - cx;
    const y = clientY - cy;

    // angle from top going clockwise
    const angleRad = Math.atan2(y, x);
    let angleDeg = (angleRad * 180) / Math.PI + 90;
    if (angleDeg < 0) angleDeg += 360;

    const newValue = clamp(Math.round((angleDeg / 360) * 10));
    onChange && onChange(newValue);
  };

  const onMouseDown = (e) => {
    setDragging(true);
    handlePointer(e.clientX, e.clientY);
  };

  const onMouseMove = (e) => {
    if (!dragging) return;
    handlePointer(e.clientX, e.clientY);
  };

  const onMouseUp = () => {
    if (dragging) setDragging(false);
  };

  const onTouchStart = (e) => {
    setDragging(true);
    const t = e.touches[0];
    handlePointer(t.clientX, t.clientY);
  };

  const onTouchMove = (e) => {
    if (!dragging) return;
    const t = e.touches[0];
    handlePointer(t.clientX, t.clientY);
  };

  const onTouchEnd = () => {
    if (dragging) setDragging(false);
  };

  useEffect(() => {
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchend", onTouchEnd);
    };
  });

  const rotationDeg = (value / 10) * 360;

  const emoji =
    value <= 2 ? "🙂" : value <= 5 ? "😐" : value <= 8 ? "😣" : "😭";

  const label =
    value === 0
      ? t("painWheel.noPain")
      : value <= 3
      ? t("painWheel.mild")
      : value <= 6
      ? t("painWheel.moderate")
      : t("painWheel.severe");

  return (
    <div className="pw-wrapper">
      <div
        className="pw-wheel"
        ref={wheelRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
      >
        <div
          className="pw-fill"
          style={{
            background: `conic-gradient(
              rgba(34,197,94,0.1) 0deg,
              rgba(34,197,94,0.9) ${Math.max(
                0,
                (value / 10) * 120
              )}deg,
              rgba(234,179,8,0.9) ${Math.max(
                (value / 10) * 120,
                (value / 10) * 220
              )}deg,
              rgba(248,113,113,0.95) ${(value / 10) * 360}deg,
              #020617 ${(value / 10) * 360}deg
            )`,
          }}
        />

        {/* Indicator */}
        <div
          className="pw-knob"
          style={{ transform: `rotate(${rotationDeg}deg)` }}
        >
          <div className="pw-knob-dot" />
        </div>

        {/* Center content */}
        <div className="pw-center">
          <div className="pw-emoji">{emoji}</div>
          <div className="pw-value">{value}/10</div>
          <div className="pw-label">{t("painWheel.label", { label })}</div>
        </div>
      </div>

      {/* Legend */}
      <div className="pw-legend">
        <span className="pw-legend-dot pw-low" /> {t("painWheel.low")}
        <span className="pw-legend-dot pw-mid" /> {t("painWheel.moderate")}
        <span className="pw-legend-dot pw-high" /> {t("painWheel.high")}
      </div>
    </div>
  );
};

export default PainWheel;
