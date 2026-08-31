import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { apiRequest } from "@/api/apiRequest";
import Loader from "@/components/common/Loader";
import { formatDateTime } from "@/utils/commonUtils";

const ConviteResposta = ({ acao }) => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState("");
  const [agendamento, setAgendamento] = useState(null);
  const [justificativa, setJustificativa] = useState("");
  const [mostrarFormJustificativa, setMostrarFormJustificativa] =
    useState(false);

  const email = searchParams.get("email");
  const isAceitar = acao === "aceitar";

  useEffect(() => {
    if (!email || !id) {
      setErro("Parâmetros inválidos na URL");
      setLoading(false);
      return;
    }

    buscarAgendamento();
  }, [id, email]);

  const buscarAgendamento = async () => {
    try {
      setLoading(true);
      const response = await apiRequest(`/api/convite/${id}?email=${encodeURIComponent(email)}`, {
        method: "GET",
      });

      if (response.success) {
        const agendamentoData = response.data;

        if (agendamentoData.status === "cancelado") {
          setErro("Este agendamento foi cancelado e não é mais válido.");
          setLoading(false);
          return;
        }

        if (agendamentoData.data_convites_enviados) {
          const agora = new Date();
          const dataEnvio = new Date(agendamentoData.data_convites_enviados);
          const horasPassadas = (agora - dataEnvio) / (1000 * 60 * 60);

          if (horasPassadas >= 24) {
            setErro(
              " Este convite expirou. Links de convite são válidos por apenas 24 horas e foram automaticamente aceitos.",
            );
            setLoading(false);
            return;
          }

          agendamentoData.horasRestantes = Math.max(0, 24 - horasPassadas);
        }

        const convidados = agendamentoData.convidados || [];
        const convidado = convidados.find(
          (c) => c.email.toLowerCase() === email.toLowerCase(),
        );

        if (!convidado) {
          setErro("Email não encontrado na lista de convidados");
          setLoading(false);
          return;
        }

        if (convidado.status !== "pendente") {
          setErro(
            `Você já respondeu a este convite como: ${convidado.status === "aceito" ? "Aceito" : "Recusado"}`,
          );
          setLoading(false);
          return;
        }

        setAgendamento(agendamentoData);
      } else {
        setErro("Agendamento não encontrado");
      }
    } catch (error) {
      setErro("Erro ao carregar agendamento");
    } finally {
      setLoading(false);
    }
  };

  const confirmarResposta = async () => {
    if (!isAceitar && (!justificativa || justificativa.trim() === "")) {
      setErro("Justificativa é obrigatória para recusar um convite");
      return;
    }

    try {
      setProcessando(true);
      setErro("");

      const endpoint = `/api/convite/${id}/${acao}`;
      const body = { email };

      if (!isAceitar) {
        body.justificativa = justificativa.trim();
      }

      const response = await apiRequest(endpoint, {
        method: "POST",
        body,
      });

      if (response.success) {
        setResultado({
          sucesso: true,
          mensagem: response.message,
          status: response.data?.status,
        });
      } else {
        setErro(response.message || `Erro ao ${acao} convite`);
      }
    } catch (error) {
      setErro(error.message || `Erro ao ${acao} convite`);
    } finally {
      setProcessando(false);
    }
  };

  const handleRecusarClick = () => {
    if (isAceitar) {
      confirmarResposta();
    } else {
      setMostrarFormJustificativa(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader message="Carregando convite..." />
      </div>
    );
  }

  if (erro && !agendamento) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Erro</h1>
          <p className="text-gray-600 mb-6">{erro}</p>
          <button
            onClick={() => navigate("/")}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  if (resultado) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div
            className={`mb-4 ${resultado.sucesso ? "text-green-500" : "text-red-500"}`}
          >
            {resultado.sucesso ? (
              <svg
                className="w-16 h-16 mx-auto"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className="w-16 h-16 mx-auto"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {resultado.sucesso ? "Sucesso!" : "Erro"}
          </h1>
          <p className="text-gray-600 mb-6">{resultado.mensagem}</p>

          {resultado.sucesso && agendamento && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-800 mb-2">
                Detalhes do Agendamento:
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div>
                  <strong>Título:</strong> {agendamento.titulo}
                </div>
                <div>
                  <strong>Data:</strong>{" "}
                  {formatDateTime(agendamento.data_inicio)}
                </div>
                {agendamento.local && (
                  <div>
                    <strong>Local:</strong> {agendamento.local}
                  </div>
                )}
                <div>
                  <strong>Status do Convite:</strong>
                  <span
                    className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                      resultado.status === "aceito"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {resultado.status === "aceito" ? "Aceito" : "Recusado"}
                  </span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => navigate("/")}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div
            className={`mb-4 ${isAceitar ? "text-green-500" : "text-orange-500"}`}
          >
            {isAceitar ? (
              <svg
                className="w-16 h-16 mx-auto"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className="w-16 h-16 mx-auto"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {isAceitar ? "Aceitar Convite" : "Recusar Convite"}
          </h1>
        </div>

        {agendamento && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">
              Detalhes do Agendamento:
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <span className="text-lg mr-2"></span>
                <span>
                  <strong>Título:</strong> {agendamento.titulo}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-lg mr-2"></span>
                <span>
                  <strong>Data:</strong>{" "}
                  {formatDateTime(agendamento.data_inicio)}
                </span>
              </div>
              {agendamento.local && (
                <div className="flex items-center">
                  <span className="text-lg mr-2"></span>
                  <span>
                    <strong>Local:</strong> {agendamento.local}
                  </span>
                </div>
              )}
              {agendamento.descricao && (
                <div className="flex items-start">
                  <span className="text-lg mr-2"></span>
                  <span>
                    <strong>Descrição:</strong> {agendamento.descricao}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mb-6">
          <p className="text-gray-600 text-center">
            Você está prestes a{" "}
            <strong>{isAceitar ? "aceitar" : "recusar"}</strong> este convite
            para o email:
          </p>
          <p className="text-center font-medium text-gray-800 mt-2">{email}</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <span className="text-yellow-600 text-lg mr-3"></span>
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">ATENÇÃO - PRAZO DE RESPOSTA</p>
              <p className="mb-2">
                Este convite tem <strong>validade de 24 horas</strong>. Se você
                não responder dentro deste prazo,{" "}
                <strong>consideraremos automaticamente como aceito</strong>e o
                agendamento será confirmado.
              </p>
              {agendamento.horasRestantes !== undefined && (
                <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 mt-3">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-yellow-700 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <p className="font-medium text-yellow-900">
                        Tempo restante:{" "}
                        <span className="text-lg font-bold">
                          {Math.floor(agendamento.horasRestantes)}h{" "}
                          {Math.floor((agendamento.horasRestantes % 1) * 60)}min
                        </span>
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        {agendamento.horasRestantes < 2
                          ? " URGENTE - Menos de 2 horas!"
                          : agendamento.horasRestantes < 6
                            ? " AVISO - Menos de 6 horas!"
                            : " Você ainda tem tempo para decidir"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {!isAceitar && mostrarFormJustificativa && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Justificativa para recusar o convite *
            </label>
            <textarea
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder="Por favor, informe o motivo da recusa..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
              rows={4}
              maxLength={500}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {justificativa.length}/500 caracteres
            </p>
          </div>
        )}

        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {erro}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
            disabled={processando}
          >
            Cancelar
          </button>

          {!mostrarFormJustificativa ? (
            <button
              onClick={handleRecusarClick}
              disabled={processando}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                isAceitar
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-red-600 text-white hover:bg-red-700"
              }`}
            >
              {processando
                ? "Processando..."
                : isAceitar
                  ? "Aceitar"
                  : "Recusar"}
            </button>
          ) : (
            <button
              onClick={confirmarResposta}
              disabled={processando || !justificativa.trim()}
              className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 bg-red-600 text-white hover:bg-red-700"
            >
              {processando ? "Processando..." : "Confirmar Recusa"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConviteResposta;
