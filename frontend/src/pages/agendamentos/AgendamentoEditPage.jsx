import React, { useEffect, useState } from "react";
import AgendamentoForm from "@/components/agendamentos/AgendamentoForm";
import { useParams, useNavigate } from "react-router-dom";
import { apiRequest } from "@/api/apiRequest";

const AgendamentoEditPage = () => {
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

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 32 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
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
          Editar Agendamento: {agendamento?.titulo}
        </h1>
      </div>

      <AgendamentoForm
        agendamento={agendamento}
        isEditing={true}
        onSuccess={() => navigate("/agendamentos")}
        onCancel={() => navigate("/agendamentos")}
      />
    </div>
  );
};

export default AgendamentoEditPage;
