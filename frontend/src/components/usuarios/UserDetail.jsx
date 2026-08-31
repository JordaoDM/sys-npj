import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiRequest } from "@/api/apiRequest";
import { useAuthContext } from "@/contexts/AuthContext";

const getRoleName = (role) => {
  if (!role) return "Usuário";
  if (typeof role === "string") return role;
  if (typeof role === "object" && role.nome) return role.nome;
  if (typeof role === "object" && role.name) return role.name;
  return "Usuário";
};

export default function UserDetail() {
  const { id } = useParams();
  const { token } = useAuthContext();
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsuario() {
      try {
        const response = await apiRequest(`/api/usuarios/${id}`, { token });
        setUsuario(response.data);
      } catch {
        setUsuario(null);
      }
      setLoading(false);
    }
    fetchUsuario();
  }, [id, token]);

  if (loading) return <div>Carregando usuário...</div>;
  if (!usuario) return <div>Usuário não encontrado.</div>;

  return (
    <div>
      <h2>Detalhes do Usuário</h2>
      <div>
        <b>Nome:</b> {usuario.nome}
      </div>
      <div>
        <b>Email:</b> {usuario.email}
      </div>
      <div>
        <b>Papel:</b> {getRoleName(usuario.role)}
      </div>
      <div>
        <b>Status:</b> {usuario.ativo ? "Ativo" : "Inativo"}
      </div>
      <div style={{ marginTop: 16 }}>
        <Link to="/usuarios">Voltar</Link>
        {" | "}
        <Link to={`/usuarios/${usuario.id}/editar`}>Editar</Link>
      </div>
    </div>
  );
}
