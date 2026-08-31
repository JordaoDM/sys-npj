import React, { useState, useEffect } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { apiRequest } from "@/api/apiRequest";
import { toastAudit } from "@/services/toastSystemAudit";
import Button from "@/components/common/Button";
import { formatDateTimeForInput, formatDate } from "@/utils/commonUtils";
import { confirmAction } from "@/services/dialogService";

const AgendamentoForm = ({
  processoId,
  agendamento = null,
  onSuccess,
  onCancel,
  isEditing = false,
  processos = [],
}) => {
  const { token, user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    processo_id: processoId || "",
    titulo: "",
    descricao: "",
    data_inicio: "",
    data_fim: "",
    local: "",
    tipo: "reuniao",
    email_lembrete: user?.email || "",
    observacoes: "",
    convidados: [],
  });

  const [newConvidado, setNewConvidado] = useState({
    email: "",
    nome: "",
  });

  const formatDateTimeForInput = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";

      const localDate = new Date(
        date.getTime() - date.getTimezoneOffset() * 60000,
      );

      return localDate.toISOString().slice(0, 16);
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return "";
    }
  };

  const getDuracaoHoras = () => {
    if (!formData.data_inicio || !formData.data_fim) return null;
    const inicio = new Date(formData.data_inicio);
    const fim = new Date(formData.data_fim);
    if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) return null;
    const diffMs = fim - inicio;
    const diffHoras = diffMs / (1000 * 60 * 60);
    return diffHoras > 0 ? diffHoras : 0;
  };

  useEffect(() => {
    if (isEditing && agendamento) {
      setFormData({
        processo_id: agendamento.processo_id || processoId,
        titulo: agendamento.titulo || "",
        descricao: agendamento.descricao || "",
        data_inicio: formatDateTimeForInput(agendamento.data_inicio) || "",
        data_fim: formatDateTimeForInput(agendamento.data_fim) || "",
        local: agendamento.local || "",
        tipo: agendamento.tipo || "reuniao",
        email_lembrete: agendamento.email_lembrete || user?.email || "",
        observacoes: agendamento.observacoes || "",
        convidados: agendamento.convidados || [],
      });
    } else if (!isEditing && user?.email) {
      setFormData((prev) => ({
        ...prev,
        email_lembrete: user.email,
      }));
    }
  }, [agendamento, isEditing, processoId, user?.email]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "data_inicio") {
      setFormData((prev) => {
        let novoFim = prev.data_fim;
        const novoInicio = value;
        if (!prev.data_fim || prev.data_fim === prev.data_inicio) {
          const inicioDate = new Date(novoInicio);
          if (!isNaN(inicioDate.getTime())) {
            const fimDate = new Date(inicioDate.getTime() + 60 * 60 * 1000);
            novoFim = fimDate.toISOString().slice(0, 16);
          }
        }
        return {
          ...prev,
          [name]: value,
          data_fim: novoFim,
        };
      });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleConvidadoChange = (e) => {
    const { name, value } = e.target;
    setNewConvidado((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const adicionarConvidado = () => {
    if (formData.convidados.length >= 10) {
      setError(" Limite máximo de 10 convidados atingido");
      return;
    }

    if (!newConvidado.email) {
      setError(" Email do convidado é obrigatório");
      return;
    }

    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(newConvidado.email)) {
      setError(
        " Por favor, insira um email válido (exemplo: usuario@dominio.com)",
      );
      return;
    }

    const emailExiste = formData.convidados.some(
      (c) => c.email.toLowerCase() === newConvidado.email.toLowerCase(),
    );
    if (emailExiste) {
      setError(" Este email já foi adicionado à lista de convidados");
      return;
    }

    if (
      user?.email &&
      newConvidado.email.toLowerCase() === user.email.toLowerCase()
    ) {
      setError(" Você não pode adicionar seu próprio email como convidado");
      return;
    }

    if (newConvidado.nome && newConvidado.nome.trim().length > 100) {
      setError(" Nome do convidado deve ter no máximo 100 caracteres");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      convidados: [
        ...prev.convidados,
        {
          ...newConvidado,
          email: newConvidado.email.toLowerCase().trim(),
          nome: newConvidado.nome.trim() || null,
          status: "pendente",
          data_convite: new Date(),
          data_resposta: null,
          justificativa: null,
        },
      ],
    }));

    setNewConvidado({ email: "", nome: "" });
    setError("");

    if (formData.convidados.length + 1 === 10) {
      setTimeout(() => {
        setError(" Limite máximo de convidados atingido (10/10)");
      }, 100);
    }
  };

  const removerConvidado = (email) => {
    setFormData((prev) => ({
      ...prev,
      convidados: prev.convidados.filter((c) => c.email !== email),
    }));
    const convidadoRemovido = formData.convidados.find(
      (c) => c.email === email,
    );
    setError("");
    console.log(` Convidado removido: ${convidadoRemovido?.nome || email}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const missingFields = [];
      if (!formData.processo_id) missingFields.push("Processo vinculado");
      if (!formData.titulo.trim()) missingFields.push("Título");
      if (!formData.data_inicio) missingFields.push("Data e hora de início");
      if (!formData.data_fim) missingFields.push("Data e hora de fim");
      if (missingFields.length > 0) {
        throw new Error(`Preencha os campos obrigatórios: ${missingFields.join(", ")}.`);
      }

      console.log(" Dados do formulário antes da validação:", formData);

      const dataInicio = new Date(formData.data_inicio);
      const dataFim = new Date(formData.data_fim);

      console.log(" Datas parseadas:", { dataInicio, dataFim });

      if (isNaN(dataInicio.getTime()) || isNaN(dataFim.getTime())) {
        throw new Error("Datas inválidas");
      }

      if (dataFim <= dataInicio) {
        throw new Error("Data de fim deve ser posterior à data de início");
      }

      const endpoint = isEditing
        ? `/api/agendamentos/${agendamento.id}`
        : "/api/agendamentos";

      const method = isEditing ? "PUT" : "POST";

      const dataToSend = { ...formData };
      if (!dataToSend.email_lembrete) {
        delete dataToSend.email_lembrete;
      }
      if (!dataToSend.observacoes) {
        delete dataToSend.observacoes;
      }
      if (!dataToSend.descricao) {
        delete dataToSend.descricao;
      }

      dataToSend.processo_id = parseInt(dataToSend.processo_id);

      dataToSend.data_inicio = dataInicio.toISOString();
      dataToSend.data_fim = dataFim.toISOString();

      console.log(" Data início formatada:", dataToSend.data_inicio);
      console.log(" Data fim formatada:", dataToSend.data_fim);

      console.log(
        " Dados sendo enviados:",
        JSON.stringify(dataToSend, null, 2),
      );

      const response = await apiRequest(endpoint, {
        method,
        body: dataToSend,
        token,
      });

      if (response.success) {
        if (isEditing) {
          toastAudit.schedule.updateSuccess(formData.titulo || "Agendamento");
        } else {
          toastAudit.schedule.createSuccess(formData.titulo || "Agendamento");
        }
        onSuccess?.(response.data);
      } else {
        if (response.errors && Array.isArray(response.errors)) {
          const errorMessages = response.errors
            .map((err) => err.msg)
            .join(", ");
          throw new Error(errorMessages);
        }
        throw new Error(response.message || "Erro ao salvar agendamento");
      }
    } catch (error) {
      console.error("Erro ao salvar agendamento:", error);
      const backendToast =
        error?.response?.data?.toast ||
        error?.data?.toast ||
        (typeof error === "object" && error.toast);

      if (backendToast) {
        const toastMessage =
          typeof backendToast === "string"
            ? backendToast
            : backendToast.message;
        toastAudit.schedule.conflictError();
        setError(
          toastMessage || "Conflito de agendamento. Verifique o toast acima.",
        );
      } else {
        const validationErrors = error?.data?.errors;
        let errorMessage = Array.isArray(validationErrors)
          ? validationErrors
              .map((item) => item.msg || item.message)
              .filter(Boolean)
              .join("; ")
          : error?.message;
        if (typeof errorMessage !== "string") {
          errorMessage = JSON.stringify(errorMessage);
        }
        if (!errorMessage) errorMessage = "Não foi possível salvar o agendamento. Revise os campos informados.";

        toastAudit.schedule.createError(errorMessage);
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "aceito":
        return "#28a745";
      case "recusado":
        return "#dc3545";
      default:
        return "#ffc107";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "aceito":
        return "Aceito";
      case "recusado":
        return "Recusado";
      default:
        return "Pendente";
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {isEditing ? " Editar Agendamento" : " Novo Agendamento"}
        </h2>
        <p className="text-gray-600">
          {isEditing
            ? "Modifique os dados do agendamento conforme necessário"
            : "Preencha os dados para criar um novo agendamento"}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
          <svg
            className="w-5 h-5 mr-3 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {formData.data_inicio &&
        formData.data_fim &&
        new Date(formData.data_fim) < new Date(formData.data_inicio) && (
          <div className="bg-warning-50 border border-warning-200 text-warning-700 px-4 py-3 rounded-lg mb-6 flex items-center">
            <svg
              className="w-5 h-5 mr-3 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              A <strong>data de fim</strong> deve ser posterior à{" "}
              <strong>data de início</strong>.
            </span>
          </div>
        )}

      {formData.processo_id === "" && (
        <div className="bg-warning-50 border border-warning-200 text-warning-700 px-4 py-3 rounded-lg mb-6 flex items-center">
          <svg
            className="w-5 h-5 mr-3 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <span>
            Selecione um <strong>processo</strong> antes de salvar o
            agendamento.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-gray-50 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Informações Básicas
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Título *
              </label>
              <input
                type="text"
                name="titulo"
                value={formData.titulo}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="Ex: Reunião com cliente"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tipo
              </label>
              <select
                name="tipo"
                value={formData.tipo}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              >
                <option value="reuniao"> Reunião</option>
                <option value="audiencia"> Audiência</option>
                <option value="prazo"> Prazo</option>
                <option value="outro"> Outro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Data e Hora de Início *
              </label>
              <input
                type="datetime-local"
                name="data_inicio"
                value={formData.data_inicio}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Data e Hora de Fim *
              </label>
              <input
                type="datetime-local"
                name="data_fim"
                value={formData.data_fim}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Local
              </label>
              <input
                type="text"
                name="local"
                value={formData.local}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="Ex: Sala 205, NPJ UFMT"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email para Lembrete
              </label>
              <input
                type="email"
                name="email_lembrete"
                value={formData.email_lembrete}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="seu@email.com"
              />
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path
                fillRule="evenodd"
                d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z"
                clipRule="evenodd"
              />
            </svg>
            Detalhes Adicionais
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-vertical"
                placeholder="Descreva o agendamento..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                name="observacoes"
                value={formData.observacoes}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-vertical"
                placeholder="Observações adicionais..."
              />
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
              Convidados
            </h3>

            <div
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                formData.convidados.length === 0
                  ? "bg-gray-100 text-gray-600"
                  : formData.convidados.length >= 8
                    ? "bg-red-100 text-red-700"
                    : formData.convidados.length >= 5
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
              }`}
            >
              {formData.convidados.length}/10 convidados
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg
                className="w-6 h-6 text-blue-600 mr-3 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-2">
                  Sistema Inteligente de Convites
                </h4>
                <div className="text-sm text-blue-800 space-y-2">
                  <p>
                    • <strong>Limite:</strong> Máximo de 10 convidados por
                    agendamento
                  </p>
                  <p>
                    • <strong>Sem convidados:</strong> Agendamento vai direto
                    para "Agendado" após aprovação
                  </p>
                  <p>
                    • <strong>Com convidados:</strong> Convites enviados
                    automaticamente para todos os convidados válidos
                  </p>
                  <p>
                    • <strong>Expiração automática:</strong> Convites não
                    respondidos são aceitos automaticamente em 24h
                  </p>
                  <p>
                    • <strong>Validação:</strong> Emails duplicados e inválidos
                    são bloqueados automaticamente
                  </p>
                </div>
              </div>
            </div>
          </div>

          {formData.convidados.length >= 8 && (
            <div
              className={`border rounded-lg p-4 mb-6 flex items-center ${
                formData.convidados.length === 10
                  ? "bg-red-50 border-red-200 text-red-700"
                  : "bg-yellow-50 border-yellow-200 text-yellow-700"
              }`}
            >
              <svg
                className="w-5 h-5 mr-3 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                {formData.convidados.length === 10
                  ? " Limite máximo de convidados atingido (10/10)"
                  : ` Próximo do limite máximo (${formData.convidados.length}/10 convidados)`}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 mb-6">
            <div className="lg:col-span-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email do Convidado
              </label>
              <input
                type="email"
                name="email"
                value={newConvidado.email}
                onChange={handleConvidadoChange}
                disabled={formData.convidados.length >= 10}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                  formData.convidados.length >= 10
                    ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                    : "border-gray-300"
                }`}
                placeholder={
                  formData.convidados.length >= 10
                    ? "Limite atingido"
                    : "convidado@email.com"
                }
              />
            </div>
            <div className="lg:col-span-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nome (opcional)
              </label>
              <input
                type="text"
                name="nome"
                value={newConvidado.nome}
                onChange={handleConvidadoChange}
                disabled={formData.convidados.length >= 10}
                maxLength={100}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                  formData.convidados.length >= 10
                    ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                    : "border-gray-300"
                }`}
                placeholder={
                  formData.convidados.length >= 10
                    ? "Limite atingido"
                    : "Nome do convidado (máx. 100 chars)"
                }
              />
            </div>
            <div className="lg:col-span-2 flex items-end">
              <button
                type="button"
                onClick={adicionarConvidado}
                disabled={
                  formData.convidados.length >= 10 || !newConvidado.email.trim()
                }
                className={`w-full px-4 py-3 font-semibold rounded-lg focus:ring-2 focus:ring-offset-2 transition-colors flex items-center justify-center ${
                  formData.convidados.length >= 10 || !newConvidado.email.trim()
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500"
                }`}
                title={
                  formData.convidados.length >= 10
                    ? "Limite de 10 convidados atingido"
                    : "Adicionar convidado"
                }
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {formData.convidados.length >= 10
                  ? "Limite atingido"
                  : "Adicionar"}
              </button>
            </div>
          </div>

          {formData.convidados.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  Lista de Convidados ({formData.convidados.length}/10)
                </h4>
                {formData.convidados.length > 0 && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (
                        await confirmAction(
                          `Tem certeza que deseja remover todos os ${formData.convidados.length} convidados?`,
                          { title: "Limpar convidados?", confirmLabel: "Remover todos" },
                        )
                      ) {
                        setFormData((prev) => ({ ...prev, convidados: [] }));
                        setError("");
                      }
                    }}
                    className="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:border-red-400 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Limpar todos
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {formData.convidados.map((convidado, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary-600">
                          {(convidado.nome || convidado.email)
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">
                          {convidado.nome || "Nome não informado"}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center">
                          <svg
                            className="w-3 h-3 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                          </svg>
                          {convidado.email}
                        </div>
                        <div
                          className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-2 ${
                            convidado.status === "aceito"
                              ? "bg-green-100 text-green-800"
                              : convidado.status === "recusado"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {getStatusText(convidado.status)}{" "}
                          {!isEditing &&
                            "• Convite será enviado após aprovação"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                        #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removerConvidado(convidado.email)}
                        className="px-3 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors flex items-center"
                        title={`Remover ${convidado.nome || convidado.email}`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center text-sm text-blue-800">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <strong>Resumo:</strong>&nbsp;
                  {formData.convidados.length} convidado(s) •
                  {10 - formData.convidados.length} espaço(s) restante(s) •
                  {!isEditing
                    ? " Convites serão enviados após aprovação do agendamento"
                    : " Novos convites são enviados automaticamente"}
                </div>
              </div>
            </div>
          )}

          {formData.convidados.length === 0 && (
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <svg
                className="w-12 h-12 text-gray-400 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Nenhum convidado adicionado ainda
              </h4>
              <p className="text-xs text-gray-500">
                Adicione até 10 convidados usando os campos acima.
                <br />
                Sem convidados, o agendamento será marcado diretamente após
                aprovação.
              </p>
            </div>
          )}
        </div>

        <div className="bg-purple-50 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
                clipRule="evenodd"
              />
            </svg>
            Processo Vinculado
          </h3>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Processo vinculado *
            </label>
            <select
              name="processo_id"
              value={formData.processo_id}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              disabled={isEditing}
            >
              {isEditing ? (
                (() => {
                  const processoAtual = Array.isArray(processos)
                    ? processos.find(
                        (p) => String(p.id) === String(formData.processo_id),
                      )
                    : null;
                  return processoAtual ? (
                    <option value={processoAtual.id}>
                      {processoAtual.numero_processo || processoAtual.numero || "Sem número"} — {processoAtual.titulo || "Sem título"}
                    </option>
                  ) : (
                    <option value={formData.processo_id}>
                      Processo vinculado
                    </option>
                  );
                })()
              ) : (
                <option value="">Selecione um processo</option>
              )}
              {!isEditing &&
                Array.isArray(processos) &&
                processos
                  .filter((p) => p.status !== "concluido")
                  .map((processo) => (
                    <option key={processo.id} value={processo.id}>
                      {processo.numero_processo || processo.numero || "Sem número"} — {processo.titulo || "Sem título"}
                    </option>
                  ))}
            </select>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-xl">
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <button
              type="button"
              onClick={() => {
                setFormData({
                  processo_id: processoId || "",
                  titulo: "",
                  descricao: "",
                  data_inicio: "",
                  data_fim: "",
                  local: "",
                  tipo: "reuniao",
                  email_lembrete: user?.email || "",
                  observacoes: "",
                  convidados: [],
                });
                setError("");
                setNewConvidado({ email: "", nome: "" });
                if (onCancel) onCancel();
              }}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                (formData.data_inicio &&
                  formData.data_fim &&
                  new Date(formData.data_fim) <
                    new Date(formData.data_inicio)) ||
                formData.processo_id === ""
              }
              className="px-6 py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4 mr-2"
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
                  Salvando...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {isEditing ? "Atualizar" : "Criar"} Agendamento
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AgendamentoForm;
