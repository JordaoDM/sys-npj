import React, { useEffect, useState } from "react";
import { fileService } from "../../api/services";
import { useAuthContext } from "../../contexts/AuthContext";
import { getFileUrl } from "../../utils/fileUrl";
import { confirmAction } from "../../services/dialogService";
import { toastService } from "../../services/toastService";

export default function FileList({ processoId }) {
  const { token, user } = useAuthContext();
  const [arquivos, setArquivos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArquivos() {
      try {
        const data = await fileService.getProcessFiles(token, processoId);
        setArquivos(data);
      } catch {
        setArquivos([]);
      }
      setLoading(false);
    }
    fetchArquivos();
  }, [processoId, token]);

  const handleDelete = async (fileId) => {
    if (!(await confirmAction("Deseja realmente excluir este arquivo?", { title: "Excluir arquivo?", confirmLabel: "Excluir" }))) return;
    try {
      await fileService.deleteFile(fileId, token);
      setArquivos(arquivos.filter((f) => f.id !== fileId));
    } catch (err) {
      toastService.error(err.message || "Erro ao excluir arquivo.");
    }
  };

  const handleUnlink = async (fileId) => {
    if (
      !(await confirmAction("Deseja realmente desvincular este arquivo do processo?", { title: "Desvincular arquivo?", confirmLabel: "Desvincular" }))
    )
      return;
    try {
      await fileService.unlinkFileFromProcess(fileId, token);
      setArquivos(arquivos.filter((f) => f.id !== fileId));
      toastService.success("Arquivo desvinculado com sucesso!");
    } catch (err) {
      toastService.error(err.message || "Erro ao desvincular arquivo.");
    }
  };

  if (loading) return <div>Carregando arquivos...</div>;

  return (
    <div>
      <h4>Arquivos Anexados</h4>
      {arquivos.length === 0 && <div>Nenhum arquivo anexado.</div>}
      <ul>
        {arquivos.map((arquivo) => (
          <li key={arquivo.id}>
            <span>{arquivo.nome}</span>{" "}
            <small>({Math.round(arquivo.tamanho / 1024)} KB)</small>
            <a
              href={getFileUrl(arquivo.caminho)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ marginLeft: 8 }}
            >
              Abrir
            </a>
            <button
              onClick={() => handleUnlink(arquivo.id)}
              style={{ marginLeft: 8 }}
            >
              Desvincular
            </button>
            {(user.role_id === 1 || user.role_id === 3) && (
              <button
                onClick={() => handleDelete(arquivo.id)}
                style={{ marginLeft: 8 }}
              >
                Excluir
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
