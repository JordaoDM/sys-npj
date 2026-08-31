import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { apiRequest } from "@/api/apiRequest";
import { useGlobalToast } from "@/contexts/ToastContext";
import AgendamentosLista from "@/components/agendamentos/AgendamentosLista";
import AgendamentosFiltros from "@/components/agendamentos/AgendamentosFiltros";
import AgendamentosPaginacao from "@/components/agendamentos/AgendamentosPaginacao";
import { confirmAction } from "@/services/dialogService";

const AgendamentosPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useAuthContext();
  const { showSuccess, showError } = useGlobalToast();
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "todos",
    tipo: "",
    local: "",
    data_inicio: "",
    data_fim: "",
    incluir_cancelados: false,
  });

  const fetchAgendamentos = async (
    newFilters = filters,
    page = pagination.page,
    limit = pagination.limit,
  ) => {
    setLoading(true);
    setError("");
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...Object.fromEntries(
          Object.entries(newFilters).filter(
            ([_, value]) =>
              value !== "" &&
              value !== false &&
              value !== null &&
              value !== undefined,
          ),
        ),
      });

      const response = await apiRequest(`/api/agendamentos?${queryParams}`, {
        method: "GET",
        token,
      });

      if (response.success) {
        setAgendamentos(
          Array.isArray(response.data)
            ? response.data
            : response.data?.agendamentos || [],
        );
        setPagination(
          response.pagination || response.data?.pagination || {
            total: 0,
            page: 1,
            limit: 12,
            totalPages: 0,
          },
        );
      } else {
        throw new Error(response.message || "Erro ao buscar agendamentos");
      }
    } catch (err) {
      console.error(" Erro ao buscar agendamentos:", err);
      setError(err.message || "Erro ao buscar agendamentos");
      setAgendamentos([]);
      setPagination({ total: 0, page: 1, limit: 12, totalPages: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgendamentos();
  }, [token]);

  useEffect(() => {
    if (location.state?.reload) {
      fetchAgendamentos();
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    fetchAgendamentos(newFilters, 1, pagination.limit);
  };

  const handlePageChange = (newPage, newLimit = pagination.limit) => {
    const pageToFetch = newLimit !== pagination.limit ? 1 : newPage;
    fetchAgendamentos(filters, pageToFetch, newLimit);
  };

  const handleEdit = (agendamento) => {
    navigate(`/agendamentos/${agendamento.id}/editar`);
  };

  const handleDelete = async (agendamentoId) => {
    if (!(await confirmAction("Tem certeza que deseja excluir este agendamento?", { title: "Excluir agendamento?", confirmLabel: "Excluir" }))) {
      return;
    }

    try {
      const response = await apiRequest(`/api/agendamentos/${agendamentoId}`, {
        method: "DELETE",
        token,
      });

      if (response.success) {
        showSuccess("Agendamento deletado com sucesso!");
        fetchAgendamentos();
      } else {
        showError(response.message || "Erro ao deletar agendamento");
      }
    } catch (err) {
      if (
        err.message &&
        err.message.includes("Apenas o criador pode deletar")
      ) {
        showError("Apenas o criador pode deletar o agendamento");
      } else {
        showError(
          "Erro ao deletar agendamento: " +
            (err.message || "Erro desconhecido"),
        );
      }
    }
  };

  const handleStatusChange = (agendamentoAtualizado) => {
    setAgendamentos((prev) =>
      Array.isArray(prev)
        ? prev
            .map((a) =>
              a && a.id === agendamentoAtualizado?.id
                ? agendamentoAtualizado
                : a,
            )
            .filter((a) => a && typeof a.id !== "undefined")
        : [],
    );
  };

  if (error) {
    return (
      <div
        style={{
          padding: "20px",
          minHeight: "100vh",
          backgroundColor: "#f8f9fa",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <div
            style={{
              color: "#dc3545",
              backgroundColor: "#f8d7da",
              border: "1px solid #f5c6cb",
              borderRadius: "6px",
              padding: "16px",
              marginBottom: "24px",
            }}
          >
            {error}
          </div>
          <button
            onClick={() => fetchAgendamentos()}
            style={{
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "20px",
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "28px",
                fontWeight: "700",
                margin: 0,
                color: "#1f2937",
              }}
            >
              Agendamentos
            </h1>
            <p
              style={{
                fontSize: "14px",
                color: "#6b7280",
                margin: "4px 0 0 0",
              }}
            >
              {pagination.total > 0
                ? `${pagination.total} agendamento${pagination.total !== 1 ? "s" : ""} encontrado${pagination.total !== 1 ? "s" : ""}`
                : "Nenhum agendamento encontrado"}
            </p>
          </div>
          <button
            onClick={() => navigate("/agendamentos/novo")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "500",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#2563eb")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "#3b82f6")}
          >
            + Novo Agendamento
          </button>
        </div>

        <AgendamentosFiltros
          onFilterChange={handleFilterChange}
          currentFilters={filters}
          loading={loading}
        />

        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "60px 20px",
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ fontSize: "18px", color: "#666" }}>
              Carregando agendamentos...
            </div>
          </div>
        ) : (
          <>
            <AgendamentosLista
              agendamentos={
                Array.isArray(agendamentos)
                  ? agendamentos.filter((a) => a && typeof a.id !== "undefined")
                  : []
              }
              showCreateButton={false}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />

            <AgendamentosPaginacao
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={handlePageChange}
              loading={loading}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default AgendamentosPage;
