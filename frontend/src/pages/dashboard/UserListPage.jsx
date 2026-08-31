import React from "react";
import UserList from "@/components/usuarios/UserList";

export default function UserListPage() {
  return (
    <>
      <div style={{ marginBottom: "20px" }}>
        <h1
          style={{
            margin: 0,
            fontSize: "24px",
            fontWeight: "600",
            color: "#343a40",
          }}
        >
          Gerenciamento de Usuários
        </h1>
        <p
          style={{
            margin: "8px 0 0 0",
            fontSize: "14px",
            color: "#6c757d",
          }}
        >
          Gerencie usuários do sistema
        </p>
      </div>

      <UserList />
    </>
  );
}
