import React from "react";

const ErrorMessage = ({ message }) => {
  if (!message) return null;
  return (
    <div
      style={{
        padding: "10px 14px",
        backgroundColor: "#ffe5e5",
        color: "#b00020",
        borderRadius: "6px",
        marginBottom: "10px",
        fontSize: "0.9rem",
      }}
    >
      {message}
    </div>
  );
};

export default ErrorMessage;
