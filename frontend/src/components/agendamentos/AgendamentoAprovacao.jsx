import React, { useState } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { agendamentoService } from "@/api/services";
import { useGlobalToast } from "@/contexts/ToastContext";
import Button from "@/components/common/Button";

const AgendamentoAprovacao = ({ agendamento, onAprovacao, onRecusa }) => {
  const { token, user } = useAuthContext();
  const { showSuccess, showError } = useGlobalToast();
  const [loading, setLoading] = useState(false);
  const [showRecusaForm, setShowRecusaForm] = useState(false);
  const [motivoRecusa, setMotivoRecusa] = useState("");
  const [observacaoAprovacao, setObservacaoAprovacao] = useState("");

  const roleName = user?.role?.nome || user?.role;
  const podeAprovar = roleName === "Admin" || roleName === "Professor";

  const handleAprovar = async () => {
    if (!podeAprovar) {
      showError("Você não tem permissão para aprovar agendamentos");
      return;
    }

    try {
      setLoading(true);
      const response = await agendamentoService.aprovar(
        token,
        agendamento.id,
        observacaoAprovacao,
      );

      if (response.success) {
        showSuccess(response.message || "Agendamento aprovado com sucesso!");
        onAprovacao && onAprovacao(response.agendamento);
      } else {
        showError(
          response.message || "Erro ao aprovar agendamento",
        );
      }
    } catch (error) {
      showError("Erro ao aprovar agendamento");
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecusar = async () => {
    if (!podeAprovar) {
      showError("Você não tem permissão para recusar agendamentos");
      return;
    }

    if (!motivoRecusa.trim()) {
      showError("Motivo da recusa é obrigatório");
      return;
    }

    try {
      setLoading(true);
      const response = await agendamentoService.recusar(
        token,
        agendamento.id,
        motivoRecusa,
      );

      if (response.success) {
        showSuccess(response.message || "Agendamento recusado");
        onRecusa && onRecusa(response.agendamento);
        setShowRecusaForm(false);
        setMotivoRecusa("");
      } else {
        showError(
          response.message || "Erro ao recusar agendamento",
        );
      }
    } catch (error) {
      showError("Erro ao recusar agendamento");
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!podeAprovar || agendamento.status !== "em_analise") {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
      <h4 className="text-sm font-medium text-blue-900 mb-3">
        Aprovação de Agendamento
      </h4>

      {!showRecusaForm ? (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações (opcional)
            </label>
            <textarea
              value={observacaoAprovacao}
              onChange={(e) => setObservacaoAprovacao(e.target.value)}
              placeholder="Adicione observações sobre a aprovação..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={handleAprovar}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
            >
              {loading ? "Aprovando..." : "Aprovar"}
            </Button>

            <Button
              onClick={() => setShowRecusaForm(true)}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
            >
              Recusar
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo da recusa *
            </label>
            <textarea
              value={motivoRecusa}
              onChange={(e) => setMotivoRecusa(e.target.value)}
              placeholder="Explique o motivo da recusa do agendamento..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={3}
              required
            />
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={handleRecusar}
              disabled={loading || !motivoRecusa.trim()}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
            >
              {loading ? "Recusando..." : "Confirmar Recusa"}
            </Button>

            <Button
              onClick={() => {
                setShowRecusaForm(false);
                setMotivoRecusa("");
              }}
              disabled={loading}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgendamentoAprovacao;
