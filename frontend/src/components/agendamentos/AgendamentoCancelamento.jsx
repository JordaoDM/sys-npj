import React, { useState } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { apiRequest } from "@/api/apiRequest";
import { useGlobalToast } from "@/contexts/ToastContext";
import Button from "@/components/common/Button";

const AgendamentoCancelamento = ({ agendamento, onCancelamento, onFechar }) => {
  const { token, user } = useAuthContext();
  const { showSuccess, showError } = useGlobalToast();
  const [loading, setLoading] = useState(false);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);

  const roleName = user?.role?.nome || user?.role;
  const podeCancelar =
    roleName === "Admin" ||
    roleName === "Professor" ||
    agendamento.usuario_id === user?.id;

  const handleCancelar = async () => {
    if (!podeCancelar) {
      showError("Você não tem permissão para cancelar este agendamento");
      return;
    }

    if (!motivoCancelamento.trim()) {
      showError("Motivo do cancelamento é obrigatório");
      return;
    }

    try {
      setLoading(true);
      const response = await apiRequest(
        `/api/agendamentos/${agendamento.id}/cancelar`,
        {
          method: "POST",
          token,
          body: {
            motivo: motivoCancelamento.trim(),
          },
        },
      );

      if (response.success) {
        showSuccess(response.message || "Agendamento cancelado com sucesso!");
        onCancelamento && onCancelamento(response.data);
        onFechar && onFechar();
      } else {
        showError(response.message || "Erro ao cancelar agendamento");
      }
    } catch (error) {
      showError("Erro ao cancelar agendamento");
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!podeCancelar) {
    return null;
  }

  if (!mostrarConfirmacao) {
    return (
      <div className="mt-4">
        <Button
          onClick={() => setMostrarConfirmacao(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
          disabled={agendamento.status === "cancelado"}
        >
          Cancelar Agendamento
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 mt-4">
      <div className="flex items-center mb-4">
        <svg
          className="w-8 h-8 text-red-600 mr-3"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <div>
          <h4 className="text-lg font-semibold text-red-900 mb-1">
            Confirmar Cancelamento
          </h4>
          <p className="text-sm text-red-700">
            Esta ação não pode ser desfeita e enviará notificações para todos os
            convidados.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-red-800 mb-2">
            Motivo do cancelamento *
          </label>
          <textarea
            value={motivoCancelamento}
            onChange={(e) => setMotivoCancelamento(e.target.value)}
            placeholder="Explique o motivo do cancelamento do agendamento..."
            className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
            rows={4}
            maxLength={500}
            required
          />
          <p className="text-xs text-red-600 mt-1">
            {motivoCancelamento.length}/500 caracteres
          </p>
        </div>

        <div className="bg-red-100 border border-red-200 rounded-lg p-3">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>
            <div>
              <p className="text-sm text-red-800 font-medium mb-1">
                Notificações que serão enviadas:
              </p>
              <ul className="text-xs text-red-700 space-y-1">
                <li>• Todos os convidados receberão email de cancelamento</li>
                <li>• Admin será notificado sobre o cancelamento</li>
                <li>• O motivo será incluído nas notificações</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex space-x-3 pt-2">
          <Button
            onClick={() => {
              setMostrarConfirmacao(false);
              setMotivoCancelamento("");
            }}
            disabled={loading}
            className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Voltar
          </Button>

          <Button
            onClick={handleCancelar}
            disabled={loading || !motivoCancelamento.trim()}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin w-4 h-4 mr-2 inline"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Cancelando...
              </>
            ) : (
              " Confirmar Cancelamento"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AgendamentoCancelamento;
