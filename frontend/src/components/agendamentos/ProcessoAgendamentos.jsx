import React from "react";
import AgendamentosLista from "./AgendamentosLista";

const ProcessoAgendamentos = ({ processoId, status }) => {
  const showCreateButton = status !== "Concluído";

  return (
    <div
      style={{
        backgroundColor: "#f8f9fa",
        padding: "20px",
        borderRadius: "8px",
        border: "1px solid #e9ecef",
      }}
    >
      <h3
        style={{
          margin: "0 0 16px 0",
          fontSize: "16px",
          fontWeight: "600",
          color: "#495057",
        }}
      >
        Agendamentos do Processo
      </h3>
      <p style={{ fontSize: "14px", color: "#6c757d", marginBottom: "16px" }}>
        Gerencie reuniões, audiências e prazos relacionados a este processo.
      </p>

      <AgendamentosLista
        processoId={processoId}
        showCreateButton={showCreateButton}
      />
    </div>
  );
};

export default ProcessoAgendamentos;
