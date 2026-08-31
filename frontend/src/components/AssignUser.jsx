import React, { useState } from "react";
import { userService } from "../api/services";
import { useAuthContext } from "../contexts/AuthContext";

const getRoleName = (role) => {
  if (!role) return "Usuário";
  if (typeof role === "string") return role;
  if (typeof role === "object" && role.nome) return role.nome;
  if (typeof role === "object" && role.name) return role.name;
  return "Usuário";
};

const AssignUser = () => {
  const { token } = useAuthContext();
  const [nome, setNome] = useState("");
  const [usuarios, setUsuarios] = useState([]);

  const buscarUsuarios = async () => {
    try {
      const data = await userService.getAllUsers(token, nome);
      setUsuarios(data);
    } catch (err) {
      console.error("Erro ao buscar usuários:", err);
      setUsuarios([]);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Digite o nome para buscar"
      />
      <button onClick={buscarUsuarios}>Buscar</button>

      <ul>
        {usuarios.map((usuario) => (
          <li key={usuario.id}>
            {getRoleName(usuario.role)}: {usuario.nome}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AssignUser;
