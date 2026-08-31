import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api/apiRequest";
import { useAuthContext } from "../../contexts/AuthContext";
import { useParams, useNavigate } from "react-router-dom";

export default function ProcessAssignStudentModal() {
  const { token } = useAuthContext();
  const { id } = useParams();
  const [alunos, setAlunos] = useState([]);
  const [selected, setSelected] = useState("");
  const [msg, setMsg] = useState("");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let url = "/api/usuarios/alunos";
    if (search) url += `?search=${encodeURIComponent(search)}`;
    apiRequest(url, { token })
      .then((data) => setAlunos(data))
      .catch(() => setAlunos([]));
  }, [token, search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      await apiRequest(`/api/processos/atribuir-aluno`, {
        method: "POST",
        token,
        body: { processo_id: id, aluno_id: selected },
      });
      setMsg("Aluno atribuído!");
      setTimeout(() => navigate(`/processos/${id}`), 1000);
    } catch (err) {
      setMsg(err.message || "Erro ao atribuir aluno.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Atribuir Aluno ao Processo</h3>
      {msg && <div>{msg}</div>}
      <input
        type="text"
        placeholder="Buscar aluno por nome..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          marginBottom: 8,
          padding: 6,
          borderRadius: 4,
          border: "1px solid #ccc",
        }}
      />
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        required
        style={{ width: "100%", marginBottom: 8 }}
      >
        <option value="">Selecione um aluno</option>
        {alunos.map((a) => (
          <option key={a.id} value={a.id}>
            {a.nome}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={!selected}
        style={{
          background: "#1976d2",
          color: "#fff",
          border: "none",
          borderRadius: 4,
          padding: "6px 16px",
          fontWeight: 500,
          fontSize: 15,
          cursor: "pointer",
        }}
      >
        Atribuir
      </button>
    </form>
  );
}
