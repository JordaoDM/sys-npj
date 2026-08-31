import React from "react";

export default function FeedbackMessage({ type = "info", children, onClose }) {
  const color =
    {
      success: "#2ecc40",
      error: "#ff4136",
      warning: "#ffdc00",
      info: "#0074d9",
    }[type] || "#0074d9";
  return (
    <div
      style={{
        background: "#f4f4f4",
        borderLeft: `6px solid ${color}`,
        padding: "12px 16px",
        margin: "12px 0",
        borderRadius: 4,
        color: "#333",
        position: "relative",
      }}
    >
      {children}
      {onClose && (
        <button
          style={{
            position: "absolute",
            top: 6,
            right: 8,
            background: "none",
            border: "none",
            fontSize: 18,
            color: "#999",
            cursor: "pointer",
          }}
          onClick={onClose}
          aria-label="Fechar"
        >
          ×
        </button>
      )}
    </div>
  );
}
