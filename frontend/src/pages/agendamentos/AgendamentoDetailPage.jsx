import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiRequest } from "@/api/apiRequest";
import { getStatusLabel } from "@/utils/commonUtils";
import { confirmAction } from "@/services/dialogService";

const AgendamentoDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [agendamento, setAgendamento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAgendamento() {
      setLoading(true);
      try {
        const response = await apiRequest(`/api/agendamentos/${id}`);
        if (response.success) {
          setAgendamento(response.data);
        } else {
          setError(response.message || "Erro ao carregar agendamento");
        }
      } catch (err) {
        setError("Erro ao carregar agendamento");
      } finally {
        setLoading(false);
      }
    }
    fetchAgendamento();
  }, [id]);

  const handleDelete = async () => {
    if (!(await confirmAction("Tem certeza que deseja excluir este agendamento?", { title: "Excluir agendamento?", confirmLabel: "Excluir" }))) {
      return;
    }

    try {
      const response = await apiRequest(`/api/agendamentos/${id}`, {
        method: "DELETE",
      });

      if (response.success) {
        navigate("/agendamentos");
      } else {
        setError(response.message || "Erro ao deletar agendamento");
      }
    } catch (error) {
      setError("Erro ao deletar agendamento");
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "confirmado":
        return "#28a745";
      case "concluido":
        return "#6c757d";
      case "cancelado":
        return "#dc3545";
      case "pendente":
      default:
        return "#ffc107";
    }
  };

  const getStatusText = (status) => getStatusLabel(status);

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "200px",
          fontSize: "18px",
          color: "#666",
        }}
      >
        Carregando agendamento...
      </div>
    );

  if (error)
    return (
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: 32,
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
          onClick={() => navigate("/agendamentos")}
          style={{
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Voltar para Agendamentos
        </button>
      </div>
    );

  if (!agendamento) return null;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 32 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 32,
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => navigate("/agendamentos")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              backgroundColor: "transparent",
              border: "1px solid #ccc",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              color: "#666",
              marginRight: "16px",
            }}
          >
            ← Voltar
          </button>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>
            {agendamento.titulo}
          </h1>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => navigate(`/agendamentos/${id}/editar`)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Editar
          </button>
          <button
            onClick={handleDelete}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Deletar
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <span
          style={{
            display: "inline-block",
            padding: "6px 12px",
            fontSize: "14px",
            fontWeight: "500",
            borderRadius: "6px",
            color: "white",
            backgroundColor: getStatusBadgeColor(agendamento.status),
          }}
        >
          {getStatusText(agendamento.status)}
        </span>
      </div>

      <div
        style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "8px",
          border: "1px solid #e9ecef",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "8px",
              }}
            >
              <span style={{ color: "#666" }}></span>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#333" }}>
                Data e Hora
              </h3>
            </div>
            <p style={{ margin: 0, color: "#666" }}>
              <strong>Início:</strong>{" "}
              {new Date(agendamento.data_inicio).toLocaleString("pt-BR")}
            </p>
            <p style={{ margin: 0, color: "#666" }}>
              <strong>Fim:</strong>{" "}
              {new Date(agendamento.data_fim).toLocaleString("pt-BR")}
            </p>
          </div>

          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "8px",
              }}
            >
              <span style={{ color: "#666" }}></span>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#333" }}>
                Tipo
              </h3>
            </div>
            <p
              style={{ margin: 0, color: "#666", textTransform: "capitalize" }}
            >
              {agendamento.tipo}
            </p>
          </div>

          {agendamento.local && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <span style={{ color: "#666" }}></span>
                <h3 style={{ margin: 0, fontSize: "16px", color: "#333" }}>
                  Local
                </h3>
              </div>
              <p style={{ margin: 0, color: "#666" }}>{agendamento.local}</p>
            </div>
          )}

          {agendamento.email_lembrete && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <span style={{ color: "#666" }}></span>
                <h3 style={{ margin: 0, fontSize: "16px", color: "#333" }}>
                  Email para Lembrete
                </h3>
              </div>
              <p style={{ margin: 0, color: "#666" }}>
                {agendamento.email_lembrete}
              </p>
            </div>
          )}

          {agendamento.usuario && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <span style={{ color: "#666" }}></span>
                <h3 style={{ margin: 0, fontSize: "16px", color: "#333" }}>
                  Criado por
                </h3>
              </div>
              <p style={{ margin: 0, color: "#666" }}>
                {agendamento.usuario.nome}
              </p>
            </div>
          )}

          {agendamento.processo && (
            <div style={{ gridColumn: "1 / -1" }}>
              <h3
                style={{ margin: "0 0 8px 0", fontSize: "16px", color: "#333" }}
              >
                Processo Relacionado
              </h3>
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "6px",
                  border: "1px solid #e9ecef",
                }}
              >
                <p style={{ margin: "0 0 4px 0", fontWeight: "500" }}>
                  {agendamento.processo.numero_processo}
                </p>
                <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
                  {agendamento.processo.titulo}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {agendamento.descricao && (
        <div
          style={{
            backgroundColor: "white",
            padding: "24px",
            borderRadius: "8px",
            border: "1px solid #e9ecef",
            marginBottom: "24px",
          }}
        >
          <h3 style={{ margin: "0 0 12px 0", fontSize: "18px", color: "#333" }}>
            Descrição
          </h3>
          <p style={{ margin: 0, color: "#666", lineHeight: "1.6" }}>
            {agendamento.descricao}
          </p>
        </div>
      )}

      {agendamento.observacoes && (
        <div
          style={{
            backgroundColor: "white",
            padding: "24px",
            borderRadius: "8px",
            border: "1px solid #e9ecef",
            marginBottom: "24px",
          }}
        >
          <h3 style={{ margin: "0 0 12px 0", fontSize: "18px", color: "#333" }}>
            Observações
          </h3>
          <p style={{ margin: 0, color: "#666", lineHeight: "1.6" }}>
            {agendamento.observacoes}
          </p>
        </div>
      )}

      {agendamento.convidados && agendamento.convidados.length > 0 && (
        <div
          style={{
            backgroundColor: "white",
            padding: "24px",
            borderRadius: "8px",
            border: "1px solid #e9ecef",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "16px",
            }}
          >
            <span style={{ color: "#666" }}></span>
            <h3 style={{ margin: 0, fontSize: "18px", color: "#333" }}>
              Convidados ({agendamento.convidados.length})
            </h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {agendamento.convidados.map((convidado, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "6px",
                }}
              >
                <div>
                  <div style={{ fontWeight: "500", fontSize: "14px" }}>
                    {convidado.nome || convidado.email}
                  </div>
                  {convidado.nome && (
                    <div style={{ fontSize: "12px", color: "#6c757d" }}>
                      {convidado.email}
                    </div>
                  )}
                </div>
                <span
                  style={{
                    padding: "4px 8px",
                    fontSize: "12px",
                    fontWeight: "500",
                    borderRadius: "4px",
                    color: "white",
                    backgroundColor: getStatusBadgeColor(convidado.status),
                  }}
                >
                  {getStatusText(convidado.status)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgendamentoDetailPage;
