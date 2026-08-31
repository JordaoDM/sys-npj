import React from "react";

export default function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.32)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 8,
          padding: 28,
          minWidth: 320,
          boxShadow: "2px 2px 20px #3332",
        }}
      >
        <h3>{title}</h3>
        <div style={{ margin: "18px 0" }}>{message}</div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 16 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: "#f8f9fa",
              border: "1px solid #adb5bd",
              color: "#343a40",
              fontWeight: 600,
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{ background: "#d9534f", color: "#fff" }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
