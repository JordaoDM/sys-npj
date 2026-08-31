import { apiRequest, uploadFile } from "./apiRequest.js";
import { API_BASE_URL } from "../utils/constants.js";

export const authService = {
  login: async (email, senha) => {
    const response = await apiRequest("/api/auth/login", {
      method: "POST",
      body: { email, senha },
    });
    return { success: response.success, ...response.data };
  },

  register: async (nome, email, senha, telefone) => {
    return await apiRequest("/api/auth/registro", {
      method: "POST",
      body: { nome, email, senha, telefone },
    });
  },

  forgotPassword: async (email) => {
    return await apiRequest("/api/auth/esqueci-senha", {
      method: "POST",
      body: { email },
    });
  },

  resetPassword: async (token, novaSenha) => {
    return await apiRequest("/api/auth/redefinir-senha", {
      method: "POST",
      body: { novaSenha },
      token,
    });
  },

  getProfile: async (token) => {
    const response = await apiRequest("/api/auth/perfil", {
      method: "GET",
      token,
    });
    return response.data;
  },

  refreshToken: async (refreshToken) => {
    const response = await apiRequest("/api/auth/refresh", {
      method: "POST",
      body: { refreshToken },
    });
    return { success: response.success, ...response.data };
  },

  logout: async (token, refreshToken) => {
    return await apiRequest("/api/auth/logout", {
      method: "POST",
      token,
      body: { refreshToken },
    });
  },
};

export const userService = {
  listUsers: async (token) => {
    return await apiRequest("/api/usuarios", {
      method: "GET",
      token,
    });
  },

  createUser: async (token, userData) => {
    return await apiRequest("/api/usuarios", {
      method: "POST",
      token,
      body: userData,
    });
  },

  getUserById: async (token, id) => {
    return await apiRequest(`/api/usuarios/${id}`, {
      method: "GET",
      token,
    });
  },

  updateUser: async (token, id, userData) => {
    return await apiRequest(`/api/usuarios/${id}`, {
      method: "PUT",
      token,
      body: userData,
    });
  },

  deleteUser: async (token, id) => {
    return await apiRequest(`/api/usuarios/${id}`, {
      method: "DELETE",
      token,
    });
  },

  getUsersForAssignment: async (token, search) => {
    const response = await apiRequest(
      `/api/usuarios/para-vinculacao?search=${encodeURIComponent(search)}`,
      {
        method: "GET",
        token,
      },
    );
    return response.data;
  },

  getAllUsers: async (token, search = "") => {
    const url = search
      ? `/api/usuarios?search=${encodeURIComponent(search)}`
      : "/api/usuarios";
    const response = await apiRequest(url, { token });
    return response.data;
  },

  reactivateUser: async (token, id) => {
    return await apiRequest(`/api/usuarios/${id}/reativar`, {
      method: "PUT",
      token,
    });
  },

  updatePassword: async (token, id, novaSenha) => {
    return await apiRequest(`/api/usuarios/${id}/senha`, {
      method: "PUT",
      token,
      body: { senha: novaSenha },
    });
  },
};

export const processService = {
  listProcesses: async (token) => {
    return await apiRequest("/api/processos", {
      method: "GET",
      token,
    });
  },

  createProcess: async (token, processData) => {
    return await apiRequest("/api/processos", {
      method: "POST",
      token,
      body: processData,
    });
  },

  getProcessosUsuario: async (token) => {
    return await apiRequest("/api/processos/usuario", {
      method: "GET",
      token,
    });
  },

  getProcessById: async (token, id) => {
    return await apiRequest(`/api/processos/${id}`, {
      method: "GET",
      token,
    });
  },

  updateProcess: async (token, id, processData) => {
    return await apiRequest(`/api/processos/${id}`, {
      method: "PUT",
      token,
      body: processData,
    });
  },

  deleteProcess: async (token, id) => {
    return await apiRequest(`/api/processos/${id}`, {
      method: "DELETE",
      token,
    });
  },

  assignUserToProcess: async (token, processoId, usuarioId, role) => {
    return await apiRequest(`/api/processos/${processoId}/vincular-usuario`, {
      method: "POST",
      token,
      body: { usuario_id: usuarioId, role, processo_id: Number(processoId) },
    });
  },

  removeUserFromProcess: async (token, processoId, usuarioId) => {
    return await apiRequest(
      `/api/processos/${processoId}/desvincular-usuario`,
      {
        method: "DELETE",
        token,
        body: { usuario_id: usuarioId },
      },
    );
  },

  concludeProcess: async (token, processoId) => {
    return await apiRequest(`/api/processos/${processoId}/concluir`, {
      method: "PUT",
      token,
    });
  },

  reopenProcess: async (token, processoId) => {
    return await apiRequest(`/api/processos/${processoId}/reabrir`, {
      method: "PUT",
      token,
    });
  },
};

export const agendamentoService = {
  listAgendamentos: async (token, filtros = {}) => {
    const queryParams = new URLSearchParams();

    if (filtros.page !== undefined) queryParams.append("page", filtros.page);
    if (filtros.limit !== undefined) queryParams.append("limit", filtros.limit);
    if (filtros.search || filtros.busca)
      queryParams.append("search", filtros.search || filtros.busca);
    if (filtros.data_inicio || filtros.dataInicio)
      queryParams.append("data_inicio", filtros.data_inicio || filtros.dataInicio);
    if (filtros.data_fim || filtros.dataFim)
      queryParams.append("data_fim", filtros.data_fim || filtros.dataFim);
    if (filtros.tipo || filtros.tipoEvento)
      queryParams.append("tipo", filtros.tipo || filtros.tipoEvento);
    if (filtros.status) queryParams.append("status", filtros.status);
    if (filtros.processo_id || filtros.processoId)
      queryParams.append("processo_id", filtros.processo_id || filtros.processoId);
    if (filtros.meus_agendamentos !== undefined)
      queryParams.append("meus_agendamentos", filtros.meus_agendamentos);

    const url = queryParams.toString()
      ? `/api/agendamentos?${queryParams}`
      : "/api/agendamentos";

    return await apiRequest(url, {
      method: "GET",
      token,
    });
  },

  createAgendamento: async (token, agendamentoData) => {
    const dadosNormalizados = {
      titulo: agendamentoData.titulo,
      descricao: agendamentoData.descricao || "",
      local: agendamentoData.local || "",
      data_inicio: agendamentoData.data_inicio || agendamentoData.dataEvento,
      data_fim: agendamentoData.data_fim || agendamentoData.dataFim,
      tipo: agendamentoData.tipo || agendamentoData.tipo_evento || agendamentoData.tipoEvento || "outro",
      processo_id:
        agendamentoData.processo_id || agendamentoData.processoId || null,
      email_lembrete: agendamentoData.email_lembrete || undefined,
      observacoes: agendamentoData.observacoes || undefined,
      convidados: agendamentoData.convidados || [],
    };

    return await apiRequest("/api/agendamentos", {
      method: "POST",
      token,
      body: dadosNormalizados,
    });
  },

  listAgendamentosUsuario: async (token) => {
    return await apiRequest("/api/agendamentos?meus_agendamentos=true", {
      method: "GET",
      token,
    });
  },

  listAgendamentosPeriodo: async (token, dataInicio, dataFim) => {
    const queryParams = new URLSearchParams({
      data_inicio: dataInicio,
      data_fim: dataFim,
    }).toString();
    return await apiRequest(`/api/agendamentos?${queryParams}`, {
      method: "GET",
      token,
    });
  },

  getEstatisticas: async (token) => {
    return await apiRequest("/api/agendamentos/stats", {
      method: "GET",
      token,
    });
  },

  getAgendamentoById: async (token, id) => {
    return await apiRequest(`/api/agendamentos/${id}`, {
      method: "GET",
      token,
    });
  },

  updateAgendamento: async (token, id, agendamentoData) => {
    const dadosNormalizados = {
      titulo: agendamentoData.titulo,
      descricao: agendamentoData.descricao,
      local: agendamentoData.local,
      data_inicio:
        agendamentoData.data_inicio ||
        agendamentoData.data_evento ||
        agendamentoData.dataEvento,
      data_fim: agendamentoData.data_fim || agendamentoData.dataFim,
      tipo: agendamentoData.tipo || agendamentoData.tipo_evento || agendamentoData.tipoEvento,
      processo_id: agendamentoData.processo_id || agendamentoData.processoId,
      email_lembrete: agendamentoData.email_lembrete,
      observacoes: agendamentoData.observacoes,
      convidados: agendamentoData.convidados,
    };

    return await apiRequest(`/api/agendamentos/${id}`, {
      method: "PUT",
      token,
      body: dadosNormalizados,
    });
  },

  deleteAgendamento: async (token, id) => {
    return await apiRequest(`/api/agendamentos/${id}`, {
      method: "DELETE",
      token,
    });
  },

  aprovar: async (token, id, observacoes = "") => {
    return await apiRequest(`/api/agendamentos/${id}/aprovar`, {
      method: "POST",
      token,
      body: { observacoes },
    });
  },

  recusar: async (token, id, motivo_recusa) => {
    return await apiRequest(`/api/agendamentos/${id}/recusar-solicitacao`, {
      method: "POST",
      token,
      body: { motivo_recusa },
    });
  },

  aceitarConvite: async (id, email) => {
    return await apiRequest(`/api/convite/${id}/aceitar`, {
      method: "POST",
      body: { email },
    });
  },

  recusarConvite: async (id, email, justificativa) => {
    return await apiRequest(`/api/convite/${id}/recusar`, {
      method: "POST",
      body: { email, justificativa },
    });
  },

  visualizarConvite: async (id) => {
    return await apiRequest(`/api/convite/${id}`, {
      method: "GET",
    });
  },

  cancelarAgendamento: async (
    token,
    id,
    motivo_cancelamento,
    cancelado_por,
  ) => {
    return await apiRequest(`/api/agendamentos/${id}/cancelar`, {
      method: "POST",
      token,
      body: { motivo: motivo_cancelamento, cancelado_por },
    });
  },

};

export const tabelaAuxiliarService = {
  getMateriaAssunto: async (token) => {
    const response = await apiRequest("/api/tabelas-auxiliares/materias", {
      method: "GET",
      token,
    });
    return response.success ? response.data : response;
  },

  getFase: async (token) => {
    const response = await apiRequest("/api/tabelas-auxiliares/fases", {
      method: "GET",
      token,
    });
    return response.success ? response.data : response;
  },

  getDiligencia: async (token) => {
    const response = await apiRequest("/api/tabelas-auxiliares/diligencias", {
      method: "GET",
      token,
    });
    return response.success ? response.data : response;
  },

  getLocalTramitacao: async (token) => {
    const response = await apiRequest(
      "/api/tabelas-auxiliares/locais-tramitacao",
      {
        method: "GET",
        token,
      },
    );
    return response.success ? response.data : response;
  },

  createMateriaAssunto: async (token, nome, descricao = "") => {
    const response = await apiRequest("/api/tabelas-auxiliares/materias", {
      method: "POST",
      token,
      body: { nome, descricao },
    });
    return response.success ? response.data : response;
  },

  createFase: async (token, nome, descricao = "") => {
    const response = await apiRequest("/api/tabelas-auxiliares/fases", {
      method: "POST",
      token,
      body: { nome, descricao },
    });
    return response.success ? response.data : response;
  },

  createDiligencia: async (token, nome, descricao = "") => {
    const response = await apiRequest("/api/tabelas-auxiliares/diligencias", {
      method: "POST",
      token,
      body: { nome, descricao },
    });
    return response.success ? response.data : response;
  },

  createLocalTramitacao: async (token, nome, descricao = "") => {
    const response = await apiRequest(
      "/api/tabelas-auxiliares/locais-tramitacao",
      {
        method: "POST",
        token,
        body: { nome, descricao },
      },
    );
    return response.success ? response.data : response;
  },

  deleteMateriaAssunto: async (token, id) => {
    return await apiRequest(`/api/tabelas-auxiliares/materias/${id}`, {
      method: "DELETE",
      token,
    });
  },

  deleteFase: async (token, id) => {
    return await apiRequest(`/api/tabelas-auxiliares/fases/${id}`, {
      method: "DELETE",
      token,
    });
  },

  deleteDiligencia: async (token, id) => {
    return await apiRequest(`/api/tabelas-auxiliares/diligencias/${id}`, {
      method: "DELETE",
      token,
    });
  },

  deleteLocalTramitacao: async (token, id) => {
    return await apiRequest(`/api/tabelas-auxiliares/locais-tramitacao/${id}`, {
      method: "DELETE",
      token,
    });
  },
};

export const atualizacaoProcessoService = {
  listAtualizacoes: async (token, queryParams = "") => {
    return await apiRequest(`/api/atualizacoes${queryParams}`, {
      method: "GET",
      token,
    });
  },

  createAtualizacao: async (token, atualizacaoData) => {
    return await apiRequest("/api/atualizacoes", {
      method: "POST",
      token,
      body: atualizacaoData,
    });
  },

  getAtualizacaoById: async (token, id) => {
    return await apiRequest(`/api/atualizacoes/${id}`, {
      method: "GET",
      token,
    });
  },

  updateAtualizacao: async (token, id, atualizacaoData) => {
    return await apiRequest(`/api/atualizacoes/${id}`, {
      method: "PUT",
      token,
      body: atualizacaoData,
    });
  },

  deleteAtualizacao: async (token, id) => {
    return await apiRequest(`/api/atualizacoes/${id}`, {
      method: "DELETE",
      token,
    });
  },
};

export const arquivoService = {
  listArquivos: async (token) => {
    const response = await apiRequest("/api/arquivos", {
      method: "GET",
      token,
    });
    return response.data;
  },

  uploadArquivo: async (token, formData) => {
    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const requestOptions = {
      method: "POST",
      headers,
      body: formData,
    };

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/arquivos/upload`,
        requestOptions,
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro no upload");
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  getArquivoById: async (token, id) => {
    const response = await apiRequest(`/api/arquivos/${id}`, {
      method: "GET",
      token,
    });
    return response.data;
  },

  downloadArquivo: async (token, id) => {
    return await apiRequest(`/api/arquivos/${id}/download`, {
      method: "GET",
      token,
    });
  },

  deleteArquivo: async (token, id) => {
    return await apiRequest(`/api/arquivos/${id}`, {
      method: "DELETE",
      token,
    });
  },
};
