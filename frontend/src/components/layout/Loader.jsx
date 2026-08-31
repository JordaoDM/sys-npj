import React from "react";

export default function Loader({ size = 48, text = "Carregando..." }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          border: "4px solid #eee",
          borderTop: "4px solid #007bff",
          borderRadius: "50%",
          width: size,
          height: size,
          animation: "spin 1s linear infinite",
        }}
      />
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      <div style={{ marginTop: 12, color: "#555" }}>{text}</div>
    </div>
  );
}
