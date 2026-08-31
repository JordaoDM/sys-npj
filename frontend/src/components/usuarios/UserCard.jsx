import React from "react";
import { Link } from "react-router-dom";
import { getUserRole } from "../../hooks/useApi";

export default function UserCard({ user, onDetails, onEdit, onManage }) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 16,
        margin: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        minWidth: 220,
        maxWidth: 260,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        background: "#fff",
      }}
    >
      <div style={{ fontWeight: "bold", fontSize: 18 }}>{user.nome}</div>
      <div style={{ color: "#555", fontSize: 14 }}>{user.email}</div>
      <div style={{ margin: "8px 0", fontSize: 13 }}>
        <b>Papel:</b> {getUserRole(user) || "Usuário"}
      </div>
      <div style={{ fontSize: 13 }}>
        <b>Status:</b> {user.ativo === false ? "Inativo" : "Ativo"}
      </div>
      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <button
          onClick={onDetails}
          style={{
            color: "#007bff",
            background: "none",
            border: "none",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          Detalhes
        </button>
        <Link
          to={`/usuarios/${user.id}/editar`}
          style={{ color: "#007bff", textDecoration: "underline" }}
        >
          Editar
        </Link>
        <button
          onClick={onManage}
          style={{
            color: "#007bff",
            background: "none",
            border: "none",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          Gerenciar
        </button>
      </div>
    </div>
  );
}
