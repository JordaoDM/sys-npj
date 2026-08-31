import React, { useState, useEffect } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { apiRequest } from "@/api/apiRequest";
import { formatDateTime, getStatusLabel } from "@/utils/commonUtils";
import { Link } from "react-router-dom";

const AgendamentosCard = ({ processoId }) => {
  const { token } = useAuthContext();
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    carregarAgendamentos();
  }, [processoId]);

  const carregarAgendamentos = async () => {
    try {
      setLoading(true);
      const response = await apiRequest(
        `/api/agendamentos?processo_id=${processoId}&status=todos`,
        {
          method: "GET",
          token,
        },
      );

      if (response.success) {
        const agendamentosOrdenados = response.data
          .sort((a, b) => new Date(a.data_inicio) - new Date(b.data_inicio))
          .slice(0, 3);
        setAgendamentos(agendamentosOrdenados);
      } else {
        setError("Erro ao carregar agendamentos");
      }
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error);
      setError("Erro ao carregar agendamentos");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "em_analise":
        return "bg-blue-100 text-blue-800";
      case "enviando_convites":
        return "bg-yellow-100 text-yellow-800";
      case "marcado":
        return "bg-green-100 text-green-800";
      case "cancelado":
        return "bg-red-100 text-red-800";
      case "finalizado":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-orange-100 text-orange-800";
    }
  };

  const getStatusText = (status) => getStatusLabel(status);

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case "audiencia":
        return "";
      case "prazo":
        return "";
      case "reuniao":
        return "";
      default:
        return "";
    }
  };

  const isProximo = (dataInicio) => {
    const agora = new Date();
    const data = new Date(dataInicio);
    const diffHoras = (data - agora) / (1000 * 60 * 60);
    return diffHoras <= 24 && diffHoras > 0;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            Agendamentos do Processo
          </h3>
        </div>
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            Agendamentos do Processo
          </h3>
        </div>
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          Agendamentos do Processo
        </h3>
        <div className="flex items-center gap-3">
          <Link
            to={`/agendamentos/novo?processo_id=${processoId}`}
            className="text-sm text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-md font-medium"
          >
            Novo agendamento
          </Link>
          <Link
            to="/agendamentos"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Ver todos
          </Link>
        </div>
      </div>

      {agendamentos.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <svg
            className="w-12 h-12 mx-auto mb-3 text-gray-300"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm">Nenhum agendamento cadastrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {agendamentos.map((agendamento) => (
            <div
              key={agendamento.id}
              className={`p-3 rounded-lg border transition-colors ${
                isProximo(agendamento.data_inicio)
                  ? "bg-yellow-50 border-yellow-200"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg">
                      {getTipoIcon(agendamento.tipo)}
                    </span>
                    <h4 className="font-medium text-gray-900 truncate">
                      {agendamento.titulo}
                    </h4>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(agendamento.status)}`}
                    >
                      {getStatusText(agendamento.status)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {formatDateTime(agendamento.data_inicio)}
                    </div>

                    {agendamento.local && (
                      <div className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="truncate">{agendamento.local}</span>
                      </div>
                    )}
                  </div>

                  {isProximo(agendamento.data_inicio) && (
                    <div className="mt-2 flex items-center text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                      <svg
                        className="w-3 h-3 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Próximo (24h)
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {agendamentos.length >= 3 && (
            <div className="text-center pt-2">
              <Link
                to="/agendamentos"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
              >
                Ver mais agendamentos
                <svg
                  className="w-4 h-4 ml-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AgendamentosCard;
