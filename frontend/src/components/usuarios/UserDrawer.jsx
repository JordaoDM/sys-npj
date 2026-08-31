import React from "react";
import { getUserRole } from "../../hooks/useApi";

export default function UserDrawer({ user, open, onClose, onEdit }) {
  if (!open || !user) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: 350,
        height: "100%",
        background: "#fff",
        boxShadow: "-2px 0 8px rgba(0,0,0,0.15)",
        zIndex: 1000,
        padding: 24,
        transition: "right 0.3s",
        overflowY: "auto",
      }}
    >
      <button onClick={onClose} style={{ float: "right" }}>
        Fechar
      </button>
      <h3>Detalhes do Usuário</h3>
      <div>
        <b>Nome:</b> {user.nome}
      </div>
      <div>
        <b>Email:</b> {user.email}
      </div>
      <div>
        <b>Papel:</b> {getUserRole(user) || "Usuário"}
      </div>
      <div>
        <b>Status:</b> {user.ativo === false ? "Inativo" : "Ativo"}
      </div>
      <div style={{ marginTop: 16 }}>
        <button onClick={onEdit}>Editar</button>
      </div>
    </div>
  );
}
