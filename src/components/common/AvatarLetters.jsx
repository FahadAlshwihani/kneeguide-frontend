import React from "react";

const AvatarLetters = ({ name, size = 38 }) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#7d5bff20",
        border: "1px solid #7d5bff50",
        color: "#c9b6ff",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontWeight: "700",
        fontSize: size * 0.38,
        userSelect: "none",
      }}
    >
      {initials}
    </div>
  );
};

export default AvatarLetters;
