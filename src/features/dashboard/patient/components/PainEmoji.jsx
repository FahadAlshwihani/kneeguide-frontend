import React from "react";
import "../styles/PainEmoji.css";

const emojis = [
  { level: 1, icon: "😄", label: "No pain" },
  { level: 3, icon: "🙂", label: "Mild" },
  { level: 5, icon: "😐", label: "Moderate" },
  { level: 7, icon: "😣", label: "Strong" },
  { level: 9, icon: "😭", label: "Severe" }
];

const PainEmoji = ({ value, onChange, note, onNoteChange }) => {
  return (
    <div className="pain-emoji-box">
      <div className="emoji-row">
        {emojis.map((e) => (
          <div
            key={e.level}
            className={`emoji-item ${value === e.level ? "active" : ""}`}
            onClick={() => onChange(e.level)}
          >
            <span className="emoji-icon">{e.icon}</span>
            <span className="emoji-label">{e.label}</span>
          </div>
        ))}
      </div>

      {/* Notes box */}
      <textarea
        className="pain-note-input"
        placeholder="Add a note about today's pain..."
        value={note}
        onChange={(e) => onNoteChange(e.target.value)}
      />
    </div>
  );
};

export default PainEmoji;
