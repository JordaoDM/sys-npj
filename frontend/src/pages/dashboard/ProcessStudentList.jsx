import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiRequest } from "@/api/apiRequest";
import { useAuthContext } from "@/contexts/AuthContext";

export default function ProcessoAlunosList() {
  const { id } = useParams();
  const { token } = useAuthContext();
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAlunos() {
      setLoading(true);
      try {
        const data = await apiRequest(`/api/processos/${id}/alunos/`, {
          token,
        });
        setAlunos(data);
      } catch {
        setAlunos([]);
      }
      setLoading(false);
    }
    fetchAlunos();
  }, [id, token]);

  return (
    <div>
      <h3>Alunos vinculados ao processo #{id}</h3>
      {loading ? (
        <div>Carregando...</div>
      ) : alunos.length === 0 ? (
        <div>Nenhum aluno vinculado.</div>
      ) : (
        <ul>
          {alunos.map((aluno) => (
            <li key={aluno.id || aluno._id}>
              {typeof aluno.nome === "object"
                ? aluno.nome?.nome || JSON.stringify(aluno.nome)
                : aluno.nome}{" "}
              ({aluno.email})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
