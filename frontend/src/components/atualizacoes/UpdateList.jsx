import React, { useEffect, useState } from "react";
import { formatDateTime } from "@/utils/commonUtils";
import { useQueryClient } from "@tanstack/react-query";
import {
  atualizacaoProcessoService,
  tabelaAuxiliarService as auxTablesService,
} from "../../api/services";
import { useAuthContext } from "../../contexts/AuthContext";
import { getUserRole } from "../../hooks/useApi";
import { requestCache } from "../../utils/requestCache";
import UpdateForm from "./UpdateForm";
import { getFileUrl } from "../../utils/fileUrl";
import { FIELD_LABELS, getFieldDisplayValue } from "./fieldNameMaps";
import { confirmAction } from "../../services/dialogService";
import { toastService } from "../../services/toastService";

function formatDescricao(descricao, auxData) {
  if (!descricao) {
    return "";
  }
  return descricao.replace(
    /([a-zA-Z_]+): '?([\d]+)'? *→ *'?([\d]+)'?/g,
    function (match, field, from, to) {
      const label = FIELD_LABELS[field] || field;
      const fromName = getFieldDisplayValue(field, from, auxData);
      const toName = getFieldDisplayValue(field, to, auxData);
      return `${label}: '${fromName}' → '${toName}'`;
    },
  );
}

export default function UpdateList({
  processoId,
  showDeleteButton = true,
  status,
}) {
  const { token, user } = useAuthContext();
  const queryClient = useQueryClient();
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [auxData, setAuxData] = useState({
    materias: [],
    fases: [],
    diligencias: [],
    localTramitacoes: [],
  });

  const fetchUpdates = async () => {
    try {
      const url = processoId ? `?processo_id=${processoId}` : "";
      const response = await atualizacaoProcessoService.listAtualizacoes(
        token,
        url,
      );
      setUpdates(response.success ? response.data : []);
    } catch {
      setUpdates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, [processoId, token]);

  useEffect(() => {
    async function fetchAux() {
      try {
        const [materias, fases, diligencias, localTramitacoes] =
          await Promise.all([
            auxTablesService.getMateriaAssunto(token),
            auxTablesService.getFase(token),
            auxTablesService.getDiligencia(token),
            auxTablesService.getLocalTramitacao(token),
          ]);
        setAuxData({ materias, fases, diligencias, localTramitacoes });
      } catch {
        setAuxData({
          materias: [],
          fases: [],
          diligencias: [],
          localTramitacoes: [],
        });
      }
    }
    fetchAux();
  }, [token]);

  if (loading) return <div>Carregando atualizações...</div>;

  const userRole = getUserRole(user);

  return (
    <div>
      <ul>
        {updates.length === 0 && <li>Nenhuma atualização encontrada.</li>}
        {updates.map((upd) => (
          <li key={upd.id}>
            {upd.tipo_atualizacao && <b>[{upd.tipo_atualizacao}] </b>}
            <span>{upd.descricao}</span>
            {upd.arquivo?.caminho && (
              <>
                <br />
                <a
                  href={getFileUrl(upd.arquivo.caminho)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ver anexo
                </a>
              </>
            )}
            <br />
            <small>
              Por{" "}
              <b>
                @
                {upd.usuario && upd.usuario.nome
                  ? upd.usuario.nome
                  : upd.usuario_nome || "Usuário"}
              </b>{" "}
              : em {formatDateTime(upd.data_atualizacao)}
            </small>
            {userRole &&
              ["professor", "admin"].includes(userRole.toLowerCase()) &&
              showDeleteButton &&
              status !== "Concluído" && (
                <button
                  style={{
                    marginLeft: 12,
                    color: "#fff",
                    background: "#d32f2f",
                    border: "none",
                    borderRadius: 4,
                    padding: "2px 10px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                  onClick={async () => {
                    if (
                      await confirmAction(
                        "Tem certeza que deseja excluir esta atualização?",
                        { title: "Excluir atualização?", confirmLabel: "Excluir" },
                      )
                    ) {
                      try {
                        await atualizacaoProcessoService.deleteAtualizacao(
                          token,
                          upd.id,
                        );
                        requestCache.clear();
                        await queryClient.invalidateQueries({
                          queryKey: ["atualizacoes"],
                        });
                        await queryClient.invalidateQueries({
                          queryKey: ["dashboard"],
                        });
                        setUpdates(updates.filter((u) => u.id !== upd.id));
                      } catch (error) {
                        console.error("Erro ao excluir atualização:", error);
                        toastService.error("Erro ao excluir atualização. Tente novamente.");
                      }
                    }
                  }}
                >
                  Excluir
                </button>
              )}
          </li>
        ))}
      </ul>
      {processoId && status && status !== "Concluído" && (
        <UpdateForm processoId={processoId} onSuccess={fetchUpdates} />
      )}
    </div>
  );
}
