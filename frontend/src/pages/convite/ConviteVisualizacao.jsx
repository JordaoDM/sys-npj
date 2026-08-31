import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { agendamentoService } from "@/api/services";
import { useToast } from "@/components/common/Toast";
import { formatDateTime } from "@/utils/commonUtils";
import Button from "@/components/common/Button";
import AgendamentoStatus from "@/components/agendamentos/AgendamentoStatus";

const ConviteVisualizacao = () => {
  const { id } = useParams();
  const { showSuccess, showError } = useToast();

  const [agendamento, setAgendamento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [showRecusaForm, setShowRecusaForm] = useState(false);
  const [email, setEmail] = useState("");
  const [motivo, setMotivo] = useState("");

  useEffect(() => {
    carregarConvite();
  }, [id]);

  const carregarConvite = async () => {
    try {
      setLoading(true);
      const response = await agendamentoService.visualizarConvite(id);

      if (response.success) {
        setAgendamento(response.data);
      } else {
        showError(response.message || "Erro ao carregar convite");
      }
    } catch (error) {
      showError("Erro ao carregar convite");
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAceitar = async () => {
    if (!email.trim()) {
      showError("Email é obrigatório");
      return;
    }

    try {
      setResponding(true);
      const response = await agendamentoService.aceitarConvite(id, email);

      if (response.success) {
        showSuccess("Convite aceito com sucesso!");
        carregarConvite();
      } else {
        showError(response.message || "Erro ao aceitar convite");
      }
    } catch (error) {
      showError("Erro ao aceitar convite");
      console.error("Erro:", error);
    } finally {
      setResponding(false);
    }
  };

  const handleRecusar = async () => {
    if (!email.trim()) {
      showError("Email é obrigatório");
      return;
    }

    if (!motivo.trim()) {
      showError("Motivo da recusa é obrigatório");
      return;
    }

    try {
      setResponding(true);
      const response = await agendamentoService.recusarConvite(
        id,
        email,
        motivo,
      );

      if (response.success) {
        showSuccess("Recusa registrada");
        setShowRecusaForm(false);
        setMotivo("");
        carregarConvite();
      } else {
        showError(response.message || "Erro ao recusar convite");
      }
    } catch (error) {
      showError("Erro ao recusar convite");
      console.error("Erro:", error);
    } finally {
      setResponding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando convite...</p>
        </div>
      </div>
    );
  }

  if (!agendamento) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Convite não encontrado
          </h1>
          <p className="text-gray-600">
            Este convite pode ter expirado ou não existe.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-blue-600 text-white p-6">
            <h1 className="text-2xl font-bold mb-2">
              Convite para Agendamento
            </h1>
            <p className="text-blue-100">
              Você foi convidado para participar de um agendamento
            </p>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {agendamento.titulo}
              </h2>
              <AgendamentoStatus status={agendamento.status} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Data e Hora
                </h3>
                <p className="text-gray-900">
                  <strong>Início:</strong>{" "}
                  {formatDateTime(agendamento.data_inicio)}
                </p>
                <p className="text-gray-900">
                  <strong>Fim:</strong> {formatDateTime(agendamento.data_fim)}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Local
                </h3>
                <p className="text-gray-900">
                  {agendamento.local || "Não informado"}
                </p>
              </div>
            </div>

            {agendamento.descricao && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Descrição
                </h3>
                <p className="text-gray-900">{agendamento.descricao}</p>
              </div>
            )}

            {agendamento.status === "enviando_convites" && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Responder ao Convite
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Seu email *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Digite seu email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {!showRecusaForm ? (
                    <div className="flex space-x-3">
                      <Button
                        onClick={handleAceitar}
                        disabled={responding || !email.trim()}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md"
                      >
                        {responding ? "Processando..." : "Aceitar Convite"}
                      </Button>

                      <Button
                        onClick={() => setShowRecusaForm(true)}
                        disabled={responding || !email.trim()}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md"
                      >
                        Recusar Convite
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Motivo da recusa *
                        </label>
                        <textarea
                          value={motivo}
                          onChange={(e) => setMotivo(e.target.value)}
                          placeholder="Por favor, explique o motivo da recusa..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                          rows={3}
                          required
                        />
                      </div>

                      <div className="flex space-x-3">
                        <Button
                          onClick={handleRecusar}
                          disabled={responding || !motivo.trim()}
                          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md"
                        >
                          {responding ? "Processando..." : "Confirmar Recusa"}
                        </Button>

                        <Button
                          onClick={() => {
                            setShowRecusaForm(false);
                            setMotivo("");
                          }}
                          disabled={responding}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {agendamento.status !== "enviando_convites" && (
              <div className="border-t pt-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-600 text-center">
                    {agendamento.status === "em_analise" &&
                      "Este agendamento ainda está em análise."}
                    {agendamento.status === "marcado" &&
                      "Este agendamento já foi confirmado."}
                    {agendamento.status === "cancelado" &&
                      "Este agendamento foi cancelado."}
                    {agendamento.status === "finalizado" &&
                      "Este agendamento já foi finalizado."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConviteVisualizacao;
