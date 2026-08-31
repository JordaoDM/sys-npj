import React, { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { arquivoService } from "../../api/services";
import { useAuthContext } from "../../contexts/AuthContext";
import { getUserRole } from "../../hooks/useApi";
import { requestCache } from "../../utils/requestCache";
import { formatDateTime } from "../../utils/commonUtils";
import DocumentUploadForm from "./DocumentUploadForm";
import { confirmAction } from "../../services/dialogService";
import { toastService } from "../../services/toastService";

export default function DocumentList({
  processoId,
  showInactive = false,
  status,
}) {
  const { token, user } = useAuthContext();
  const queryClient = useQueryClient();
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);

  const userRole = getUserRole(user);

  useEffect(() => {
    async function fetchDocumentos() {
      try {
        let data = await arquivoService.listArquivos(token);

        if (processoId) {
          data = data.filter(
            (doc) => String(doc.processo_id) === String(processoId),
          );

          if (showInactive) {
            try {
              const response = await fetch(
                `http://localhost:3001/api/arquivos?processo_id=${processoId}&incluir_inativos=true`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                },
              );
              if (response.ok) {
                const payload = await response.json();
                data = payload.data;
              }
            } catch (error) {
              console.log(
                "Erro ao buscar arquivos inativos, usando apenas ativos:",
                error,
              );
            }
          }
        }
        setDocumentos(data);
      } catch (error) {
        console.error("Erro ao carregar documentos:", error);
        setDocumentos([]);
      }
      setLoading(false);
    }
    if (token) {
      fetchDocumentos();
    }
  }, [processoId, token, showUploadForm, showInactive]);

  const handleDownload = async (arquivoId, nomeOriginal) => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/arquivos/${arquivoId}/download`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Erro no download");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = nomeOriginal || "documento";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Erro no download:", error);
      toastService.error("Erro ao baixar o arquivo");
    }
  };

  const handleDelete = async (arquivoId) => {
    if (
      !(await confirmAction(
        "Tem certeza que deseja remover este documento?\n\nNota: Se o documento estiver vinculado a um processo, ele será mantido no histórico do processo.",
        { title: "Remover documento?", confirmLabel: "Remover" },
      ))
    ) {
      return;
    }

    try {
      const response = await arquivoService.deleteArquivo(token, arquivoId);

      requestCache.clear();
      await queryClient.invalidateQueries({ queryKey: ["arquivos"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });

      setDocumentos(documentos.filter((doc) => doc.id !== arquivoId));

      if (response.vinculado_processo) {
        toastService.info(
          "Documento removido da lista geral, mas mantido no processo para preservar o histórico.",
        );
      } else {
        toastService.success("Documento removido completamente.");
      }
    } catch (error) {
      console.error("Erro ao deletar documento:", error);
      toastService.error(
        "Erro ao remover o documento: " +
          (error.message || "Erro desconhecido"),
      );
    }
  };

  if (loading) return <div>Carregando documentos...</div>;

  return (
    <div>
      {["admin", "professor", "aluno"].includes(userRole?.toLowerCase()) &&
        status !== "Concluído" && (
          <button
            onClick={() => setShowUploadForm((v) => !v)}
            style={{
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
              marginBottom: "16px",
            }}
          >
            {showUploadForm ? "Cancelar" : " Adicionar Documento"}
          </button>
        )}

      {showUploadForm && (
        <DocumentUploadForm
          processoId={processoId}
          onSuccess={async () => {
            setShowUploadForm(false);

            requestCache.clear();
            await queryClient.invalidateQueries({ queryKey: ["arquivos"] });
            await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          }}
          onCancel={() => setShowUploadForm(false)}
        />
      )}

      <div style={{ marginTop: "16px" }}>
        {documentos.length === 0 ? (
          <p style={{ color: "#6c757d", fontStyle: "italic" }}>
            Nenhum documento anexado ao processo.
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {documentos.map((doc) => (
              <li
                key={doc.id}
                style={{
                  border: "1px solid #e9ecef",
                  borderRadius: "4px",
                  padding: "12px",
                  marginBottom: "8px",
                  backgroundColor: doc.ativo === false ? "#f1f1f1" : "#f8f9fa",
                  opacity: doc.ativo === false ? 0.7 : 1,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <strong style={{ color: "#495057" }}>
                      {doc.nome_original || doc.nome}
                      {doc.ativo === false && (
                        <span
                          style={{
                            marginLeft: "8px",
                            color: "#dc3545",
                            fontSize: "12px",
                            fontWeight: "normal",
                            fontStyle: "italic",
                          }}
                        >
                          (removido)
                        </span>
                      )}
                    </strong>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6c757d",
                        marginTop: "4px",
                      }}
                    >
                      Tamanho: {(doc.tamanho / 1024).toFixed(1)} KB | Tipo:{" "}
                      {doc.tipo} | Enviado por: {doc.usuario?.nome || "Usuário"}{" "}
                      | Data: {formatDateTime(doc.criado_em)}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() =>
                        handleDownload(doc.id, doc.nome_original || doc.nome)
                      }
                      style={{
                        backgroundColor: "#28a745",
                        color: "white",
                        border: "none",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      Baixar
                    </button>
                    {userRole &&
                      ["professor", "admin"].includes(
                        userRole.toLowerCase(),
                      ) && (
                        <button
                          onClick={() => handleDelete(doc.id)}
                          style={{
                            backgroundColor: "#dc3545",
                            color: "white",
                            border: "none",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          Remover
                        </button>
                      )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
