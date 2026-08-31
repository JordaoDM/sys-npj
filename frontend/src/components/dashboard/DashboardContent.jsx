import React from "react";
import { useNavigate } from "react-router-dom";
import { useDashboardData } from "../../hooks/useApi";
import { useAuthContext } from "../../contexts/AuthContext";
import { getUserRole } from "../../hooks/useApi";
import { useDashboardAutoRefresh } from "../../hooks/useAutoRefresh";

const DashboardContent = () => {
  const navigate = useNavigate();
  const { data: dashboardData, isLoading, error, refetch } = useDashboardData();
  const { user } = useAuthContext();
  const userRole = getUserRole(user);

  const { refreshDashboard } = useDashboardAutoRefresh(30000);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-48 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-red-800 font-medium">
              Erro ao carregar dashboard
            </h3>
            <p className="text-red-600 text-sm mt-1">{error.message}</p>
          </div>
          <button
            onClick={() => refetch()}
            className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-md text-sm"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg text-white overflow-hidden">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                Bem-vindo, {user?.nome || "Usuário"}!
              </h1>
              <p className="text-blue-100 text-lg">
                Painel de controle do NPJ - Perfil: {userRole}
              </p>
              {dashboardData?.ultimaAtualizacao && (
                <p className="text-blue-200 text-sm mt-2">
                  Última atualização:{" "}
                  {new Date(dashboardData.ultimaAtualizacao).toLocaleString(
                    "pt-BR",
                  )}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => refetch()}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all"
                title="Atualizar dados"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Atualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {" "}
            Visão Geral
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div
              className="bg-blue-50 border border-blue-200 rounded-xl p-6 cursor-pointer hover:shadow-md transition-all hover:scale-105"
              onClick={() => navigate("/processos")}
            >
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-600">
                    {" "}
                    Total de Processos
                  </p>
                  <p className="text-3xl font-bold text-blue-900">
                    {dashboardData?.processosTotal || 0}
                  </p>
                  <p className="text-xs text-blue-500 mt-1">
                    Clique para ver detalhes
                  </p>
                </div>
              </div>
            </div>

            <div
              className="bg-green-50 border border-green-200 rounded-xl p-6 cursor-pointer hover:shadow-md transition-all hover:scale-105"
              onClick={() => navigate("/processos?filter=ativos")}
            >
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-600">
                    {" "}
                    Processos Ativos
                  </p>
                  <p className="text-3xl font-bold text-green-900">
                    {dashboardData?.processosAtivos || 0}
                  </p>
                  <p className="text-xs text-green-500 mt-1">Em andamento</p>
                </div>
              </div>
            </div>

            <div
              className="bg-purple-50 border border-purple-200 rounded-xl p-6 cursor-pointer hover:shadow-md transition-all hover:scale-105"
              onClick={() => navigate("/arquivos")}
            >
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <svg
                    className="w-8 h-8 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-purple-600">
                    {" "}
                    Documentos
                  </p>
                  <p className="text-3xl font-bold text-purple-900">
                    {dashboardData?.totalArquivos || 0}
                  </p>
                  <p className="text-xs text-purple-500 mt-1">
                    {userRole === "Aluno"
                      ? "Meus arquivos"
                      : "Arquivos no sistema"}
                  </p>
                </div>
              </div>
            </div>

            {(userRole === "Admin" || userRole === "Professor") && (
              <div
                className="bg-orange-50 border border-orange-200 rounded-xl p-6 cursor-pointer hover:shadow-md transition-all hover:scale-105"
                onClick={() => navigate("/usuarios")}
              >
                <div className="flex items-center">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <svg
                      className="w-8 h-8 text-orange-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a7.5 7.5 0 0115 0"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-orange-600">
                      {" "}
                      Usuários
                    </p>
                    <p className="text-3xl font-bold text-orange-900">
                      {dashboardData?.totalUsuarios || 0}
                    </p>
                    <p className="text-xs text-orange-500 mt-1">
                      Ativos: {dashboardData?.usuariosAtivos || 0}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {dashboardData?.processosPorStatus &&
              Object.keys(dashboardData.processosPorStatus).length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg
                      className="w-5 h-5 text-blue-600 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    Processos por Status
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(dashboardData.processosPorStatus).map(
                      ([status, count]) => {
                        const getStatusColor = (status) => {
                          const colors = {
                            "Em andamento": "text-blue-600 bg-blue-100",
                            Aguardando: "text-yellow-600 bg-yellow-100",
                            Finalizado: "text-green-600 bg-green-100",
                            Arquivado: "text-gray-600 bg-gray-100",
                            Suspenso: "text-red-600 bg-red-100",
                          };
                          return colors[status] || "text-gray-600 bg-gray-100";
                        };

                        return (
                          <div
                            key={status}
                            className="flex justify-between items-center p-3 bg-white rounded-lg"
                          >
                            <div className="flex items-center">
                              <span
                                className={`inline-block w-3 h-3 rounded-full mr-3 ${getStatusColor(status)}`}
                              ></span>
                              <span className="text-sm font-medium text-gray-700 capitalize">
                                {status.replace("_", " ")}
                              </span>
                            </div>
                            <span className="text-lg font-bold text-gray-900">
                              {count}
                            </span>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              )}

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg
                  className="w-5 h-5 text-green-600 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Suas Informações
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-sm font-medium text-gray-700">
                    Perfil
                  </span>
                  <span className="text-sm font-bold text-blue-600">
                    {userRole}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-sm font-medium text-gray-700">
                    Nome
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {user?.nome || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-sm font-medium text-gray-700">
                    Email
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {user?.email || "N/A"}
                  </span>
                </div>
                {userRole === "Aluno" && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>Acesso de Aluno:</strong> Você pode visualizar
                      apenas seus processos e criar agendamentos.
                    </p>
                  </div>
                )}
                {(userRole === "Admin" || userRole === "Professor") && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800">
                      <strong>Acesso {userRole}:</strong> Você tem permissões
                      para gerenciar processos, usuários e sistema.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg
                className="w-5 h-5 text-purple-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Ações Rápidas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => navigate("/processos")}
                className="bg-white hover:bg-blue-50 border border-blue-200 rounded-lg p-4 text-left transition-all hover:shadow-md"
              >
                <div className="flex items-center">
                  <svg
                    className="w-6 h-6 text-blue-600 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-900">
                    Ver Processos
                  </span>
                </div>
              </button>

              <button
                onClick={() => navigate("/agendamentos")}
                className="bg-white hover:bg-purple-50 border border-purple-200 rounded-lg p-4 text-left transition-all hover:shadow-md"
              >
                <div className="flex items-center">
                  <svg
                    className="w-6 h-6 text-purple-600 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-900">
                    Agendamentos
                  </span>
                </div>
              </button>

              <button
                onClick={() => navigate("/arquivos")}
                className="bg-white hover:bg-green-50 border border-green-200 rounded-lg p-4 text-left transition-all hover:shadow-md"
              >
                <div className="flex items-center">
                  <svg
                    className="w-6 h-6 text-green-600 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-900">
                    Documentos
                  </span>
                </div>
              </button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>Sistema NPJ - Dashboard atualizado automaticamente</span>
              <span>Dados em tempo real do banco de dados</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
