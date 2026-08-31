import React, { useState } from "react";
import { useGlobalToast } from "@/contexts/ToastContext";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { apiRequest } from "@/api/apiRequest";
import Button from "@/components/common/Button";
import StatusBadge from "@/components/common/StatusBadge";
import Loader from "@/components/common/Loader";
import AgendamentoForm from "./AgendamentoForm";
import AgendamentoAprovacao from "./AgendamentoAprovacao";
import AgendamentoStatus from "./AgendamentoStatus";
import {
  formatDate,
  formatDateTime,
  getStatusLabel,
} from "@/utils/commonUtils";
import { confirmAction } from "@/services/dialogService";

const AgendamentosLista = ({
  agendamentos = [],
  showCreateButton = true,
  onEdit,
  onDelete,
  onStatusChange,
  onEnviarLembrete,
}) => {
  const { showSuccess, showError } = useGlobalToast();
  const { token, user } = useAuthContext();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editingAgendamento, setEditingAgendamento] = useState(null);


  const handleEdit = (agendamento) => {
    if (onEdit) {
      onEdit(agendamento);
    } else {
      setEditingAgendamento(agendamento);
      setShowForm(true);
    }
  };

  const handleDelete = async (agendamento) => {
    if (onDelete) {
      onDelete(agendamento.id);
    } else {
      if (
        !(await confirmAction(
          `Tem certeza que deseja deletar o agendamento "${agendamento.titulo}"?`,
          { title: "Excluir agendamento?", confirmLabel: "Excluir" },
        ))
      ) {
        return;
      }

      try {
        const response = await apiRequest(
          `/api/agendamentos/${agendamento.id}`,
          {
            method: "DELETE",
            token,
          },
        );

        if (response.success) {
          showSuccess("Agendamento deletado com sucesso!");
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
    }
  };

  const handleFormSuccess = async () => {
    setShowForm(false);
    setEditingAgendamento(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingAgendamento(null);
  };


  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case "reuniao":
        return "";
      case "audiencia":
        return "";
      case "prazo":
        return "";
      default:
        return "";
    }
  };

  const getTipoText = (tipo) => {
    switch (tipo) {
      case "reuniao":
        return "Reunião";
      case "audiencia":
        return "Audiência";
      case "prazo":
        return "Prazo";
      default:
        return "Outro";
    }
  };

  const getStatusText = (status) => getStatusLabel(status);

  const canEdit = (agendamento) => {
    return (
      user?.role === "Admin" ||
      user?.role === "Professor" ||
      agendamento.criado_por === user?.id
    );
  };

  const canDelete = (agendamento) => {
    return (
      user?.role === "Admin" ||
      user?.role === "Professor" ||
      agendamento.criado_por === user?.id
    );
  };

  const canApprove = (agendamento) => {
    const roleName = user?.role?.nome || user?.role;
    const isAdminOrProfessor = roleName === "Admin" || roleName === "Professor";
    const isEmAnalise = agendamento.status === "em_analise";
    return isAdminOrProfessor && isEmAnalise;
  };

  if (showForm) {
    return (
      <AgendamentoForm
        agendamento={editingAgendamento}
        isEditing={!!editingAgendamento}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {agendamentos.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">Você ainda não possui agendamentos.</p>
          {showCreateButton && (
            <p className="mt-2 text-sm">
              Clique em{" "}
              <span className="font-semibold text-primary-600">Novo</span> para
              criar seu primeiro agendamento.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {agendamentos.map((agendamento) => (
            <div
              key={agendamento.id}
              className="flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md"
            >
              <div className="mb-4 min-w-0 border-b border-gray-100 pb-4">
                <div className="min-w-0">
                  <button
                    type="button"
                    className="block w-full truncate rounded-lg bg-primary-600 px-3 py-2 text-left text-lg font-semibold text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2"
                    onClick={() => navigate(`/agendamentos/${agendamento.id}`)}
                    title={agendamento.titulo}
                  >
                    {agendamento.titulo}
                  </button>
                  <div className="mt-3 flex min-h-7 flex-wrap items-center gap-2">
                    <span className="inline-flex h-7 items-center whitespace-nowrap rounded-full border border-primary-200 bg-primary-50 px-3 text-xs font-semibold leading-none text-primary-700">
                      {getTipoText(agendamento.tipo)}
                    </span>
                    <AgendamentoStatus
                      status={agendamento.status}
                      showDescription={false}
                    />
                  </div>
                </div>
              </div>
              <div className="mb-4 flex flex-1 flex-col gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-primary-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    Início:{" "}
                    <span className="font-medium text-gray-800">
                      {formatDateTime(agendamento.data_inicio)}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-primary-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    Fim:{" "}
                    <span className="font-medium text-gray-800">
                      {formatDateTime(agendamento.data_fim)}
                    </span>
                  </span>
                </div>
              </div>
              <div className="mt-auto grid grid-cols-2 gap-2 border-t border-gray-100 pt-4">
                <button
                  className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
                  onClick={() => navigate(`/agendamentos/${agendamento.id}`)}
                >
                  Ver Detalhes
                </button>
                {canEdit(agendamento) && (
                  <button
                    className="inline-flex min-h-10 items-center justify-center rounded-lg bg-yellow-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-yellow-600"
                    onClick={() => handleEdit(agendamento)}
                  >
                    Editar
                  </button>
                )}
                {canDelete(agendamento) && (
                  <button
                    className="inline-flex min-h-10 items-center justify-center rounded-lg bg-danger-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-danger-700"
                    onClick={() => handleDelete(agendamento)}
                  >
                    Excluir
                  </button>
                )}
                <button
                  className="inline-flex min-h-10 items-center justify-center rounded-lg bg-success-600 px-3 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-success-700"
                  onClick={async () => {
                    try {
                      const response = await apiRequest(
                        `/api/agendamentos/${agendamento.id}/lembrete`,
                        {
                          method: "POST",
                          token,
                        },
                      );
                      if (response.success) {
                        showSuccess(
                          response.message || "Lembrete enviado com sucesso!",
                        );
                      } else {
                        showError(
                          response.message || "Falha ao enviar lembrete.",
                        );
                      }
                    } catch (err) {
                      showError(
                        "Falha ao enviar lembrete: " +
                          (err.message || "Erro desconhecido"),
                      );
                    }
                  }}
                >
                  Enviar Lembrete
                </button>
              </div>

              {canApprove(agendamento) && (
                <AgendamentoAprovacao
                  agendamento={agendamento}
                  onAprovacao={(agendamentoAtualizado) => {
                    onStatusChange && onStatusChange(agendamentoAtualizado);
                  }}
                  onRecusa={(agendamentoAtualizado) => {
                    onStatusChange && onStatusChange(agendamentoAtualizado);
                  }}
                />
              )}

              {agendamento.convidados && agendamento.convidados.length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                    Convidados ({agendamento.convidados.length})
                  </h5>
                  <div className="flex flex-wrap gap-1">
                    {agendamento.convidados
                      .slice(0, 3)
                      .map((convidado, index) => (
                        <span
                          key={index}
                          className="inline-flex h-6 max-w-full items-center truncate rounded-full bg-blue-100 px-2.5 text-xs font-medium text-blue-800"
                        >
                          {convidado.nome || convidado.email}
                        </span>
                      ))}
                    {agendamento.convidados.length > 3 && (
                      <span className="inline-block text-gray-500 text-xs px-2 py-1">
                        +{agendamento.convidados.length - 3} mais
                      </span>
                    )}
                  </div>
                </div>
              )}

              {agendamento.status === "cancelado" &&
                agendamento.motivo_recusa && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <h5 className="text-sm font-medium text-red-800 mb-1">
                      Motivo da recusa
                    </h5>
                    <p className="text-sm text-red-700">
                      {agendamento.motivo_recusa}
                    </p>
                  </div>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgendamentosLista;
