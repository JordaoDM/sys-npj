import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useProcessos } from "@/hooks/useApi.jsx";
import { useDebounce } from "@/hooks/useDebounce";
import { useProcessoAutoRefresh } from "@/hooks/useAutoRefresh";
import DataTable from "@/components/common/DataTable";
import Button from "@/components/common/Button";
import StatusBadge from "@/components/common/StatusBadge";
import Loader from "@/components/layout/Loader";
import {
  getUserRole,
  canCreateProcess,
  formatDate,
  renderValue,
} from "@/utils/commonUtils";
import { processService } from "@/api/services";
import { useQueryClient } from "@tanstack/react-query";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { toastService } from "@/services/toastService";

export default function ProcessListPage() {
  const navigate = useNavigate();
  const { user, token } = useAuthContext();
  const queryClient = useQueryClient();
  const { afterConcluirProcesso, afterReabrirProcesso, refreshProcessos } =
    useProcessoAutoRefresh();

  const [searchTerm, setSearchTerm] = useState("");
  const [showMyProcesses, setShowMyProcesses] = useState(
    () => getUserRole(user) === "Aluno",
  );
  const [showConcluidos, setShowConcluidos] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmation, setConfirmation] = useState(null);
  const itemsPerPage = 10;

  const debouncedSearch = useDebounce(searchTerm, 300);

  const {
    data: processosData,
    isLoading,
    error,
    refetch,
  } = useProcessos(
    debouncedSearch,
    showMyProcesses,
    currentPage,
    itemsPerPage,
    showConcluidos,
  );

  const processos = processosData?.processos || [];
  const totalPages = processosData?.totalPages || 1;
  const hasMore = processosData?.hasMore || false;
  const totalItems = processosData?.totalItems || 0;

  const handleNextPage = () => {
    if (hasMore) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, showMyProcesses, showConcluidos]);

  const handleMyProcessesToggle = () => {
    setShowMyProcesses((current) => !current);
  };

  const handleConcluidosToggle = () => {
    setShowConcluidos(!showConcluidos);
  };

  const handleConcluirProcesso = async (processoId) => {
    try {
      await processService.concludeProcess(token, processoId);
      afterConcluirProcesso();
      toastService.success("Processo concluído com sucesso!");
    } catch (error) {
      console.error("Erro ao concluir processo:", error);
      toastService.error(
        "Erro ao concluir processo: " + (error.message || "Erro desconhecido"),
      );
    }
  };

  const handleReabrirProcesso = async (processoId) => {
    try {
      await processService.reopenProcess(token, processoId);
      afterReabrirProcesso();
      toastService.success("Processo reaberto com sucesso!");
    } catch (error) {
      console.error("Erro ao reabrir processo:", error);
      toastService.error(
        "Erro ao reabrir processo: " + (error.message || "Erro desconhecido"),
      );
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "numero_processo",
        label: "Número do Processo",
        render: (value, row) => (
          <Button
            variant="link"
            onClick={() => navigate(`/processos/${row.id}`)}
            style={{
              padding: 0,
              fontSize: "14px",
              fontWeight: "500",
              textDecoration: "underline",
            }}
          >
            {value || row.numero || "-"}
          </Button>
        ),
      },
      {
        key: "titulo",
        label: "Título",
        render: (value) => renderValue(value),
      },
      {
        key: "descricao",
        label: "Descrição",
        render: (value) => renderValue(value),
      },
      {
        key: "status",
        label: "Status",
        render: (value) => <StatusBadge status={value} />,
      },
      {
        key: "assistido",
        label: "Assistido",
        render: (value) => renderValue(value),
      },
      {
        key: "updatedAt",
        label: "Última Atualização",
        render: (value, row) => formatDate(value || row.criado_em),
      },
      {
        key: "actions",
        label: "Ações",
        render: (_, row) => (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <Button
              variant="primary"
              onClick={() => navigate(`/processos/${row.id}`)}
            >
              Ver Detalhes
            </Button>
            {getUserRole(user) !== "Aluno" &&
              (row.status === "Concluído" ? (
                <Button
                  variant="success"
                  onClick={() => setConfirmation({ action: "reopen", id: row.id })}
                >
                  Reabrir
                </Button>
              ) : (
                <Button
                  variant="blueWhite"
                  onClick={() => setConfirmation({ action: "conclude", id: row.id })}
                >
                  Concluir
                </Button>
              ))}
          </div>
        ),
      },
    ],
    [navigate],
  );

  if (!user) {
    return <Loader message="Verificando autenticação" />;
  }

  if (error) return <Loader error={error} />;

  return (
    <div
      style={{
        backgroundColor: "white",
        borderRadius: "8px",
        padding: "24px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        border: "1px solid #e9ecef",
        marginBottom: "24px",
      }}
    >
      <h1
        style={{
          margin: 0,
          fontSize: "24px",
          fontWeight: "600",
          color: "#212529",
        }}
      >
        <span
          style={{
            fontSize: "24px",
            marginRight: "8px",
            verticalAlign: "middle",
          }}
        ></span>
        Lista de Processos
      </h1>
      <p
        style={{
          margin: "8px 0 0 0",
          fontSize: "14px",
          color: "#6c757d",
        }}
      >
        Gerencie todos os processos do sistema - Mostrando {itemsPerPage}{" "}
        processos por página
      </p>

      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          margin: "20px 0",
        }}
      >
        {getUserRole(user) !== "Aluno" && (
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={showMyProcesses}
              onChange={handleMyProcessesToggle}
              style={{ transform: "scale(1.1)" }}
            />
            Apenas meus processos
          </label>
        )}

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            cursor: "pointer",
            marginRight: "auto",
          }}
        >
          <input
            type="checkbox"
            checked={showConcluidos}
            onChange={handleConcluidosToggle}
            style={{ transform: "scale(1.1)" }}
          />
          {showConcluidos ? "Apenas concluídos" : "Mostrar concluídos"}
        </label>

        {canCreateProcess(user) && (
          <Button
            id="btn-add-process"
            variant="success"
            onClick={() => navigate("/processos/novo")}
          >
            Novo Processo
          </Button>
        )}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
          fontSize: "14px",
          color: "#6c757d",
        }}
      >
        <span>
          Total: {totalItems} processos | Página {currentPage} de {totalPages}
        </span>
      </div>

      <div style={{ marginBottom: "20px" }}>
        {isLoading ? (
          <Loader message="Carregando processos..." />
        ) : processos.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "#6c757d",
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
              border: "1px solid #e9ecef",
            }}
          >
            <p style={{ margin: 0, fontSize: "16px" }}>
              {searchTerm
                ? "Nenhum processo encontrado para a busca"
                : "Nenhum processo encontrado"}
            </p>
          </div>
        ) : (
          <DataTable
            data={processos}
            columns={columns}
            itemsPerPage={processos.length}
            searchableColumns={[
              "numero_processo",
              "titulo",
              "descricao",
              "assistido",
            ]}
            sortableColumns={[
              "numero_processo",
              "titulo",
              "descricao",
              "status",
              "assistido",
              "updatedAt",
            ]}
            onRowClick={(row) => navigate(`/processos/${row.id}`)}
            loading={isLoading}
            emptyMessage="Nenhum processo encontrado"
          />
        )}
      </div>

      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "10px",
            marginTop: "20px",
          }}
        >
          <Button
            variant="outline"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>

          <div style={{ display: "flex", gap: "5px" }}>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "primary" : "light"}
                  onClick={() => handlePageChange(pageNum)}
                  style={{ margin: "0 2px" }}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
          >
            Próxima
          </Button>
        </div>
      )}
      <ConfirmDialog
        open={Boolean(confirmation)}
        title={confirmation?.action === "conclude" ? "Concluir processo?" : "Reabrir processo?"}
        message={confirmation?.action === "conclude" ? "O processo ficará bloqueado para alterações até ser reaberto." : "O processo voltará a aceitar alterações."}
        onCancel={() => setConfirmation(null)}
        onConfirm={async () => {
          const pending = confirmation;
          setConfirmation(null);
          if (pending?.action === "conclude") await handleConcluirProcesso(pending.id);
          if (pending?.action === "reopen") await handleReabrirProcesso(pending.id);
        }}
      />
    </div>
  );
}
