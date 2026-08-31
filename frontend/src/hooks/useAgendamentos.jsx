import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { agendamentoService } from "../api/services";
import { useAuthContext } from "../contexts/AuthContext";

export function useAgendamentos(filtros = {}) {
  const { token } = useAuthContext();

  return useQuery({
    queryKey: ["agendamentos", filtros],
    queryFn: async () => {
      if (!token) throw new Error("Token não disponível");
      return await agendamentoService.listAgendamentos(token, filtros);
    },
    enabled: !!token,
    staleTime: 30 * 1000,
    cacheTime: 2 * 60 * 1000,
    refetchInterval: 30 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}

export function useAgendamentosUsuario() {
  const { token } = useAuthContext();

  return useQuery({
    queryKey: ["agendamentos", "usuario"],
    queryFn: async () => {
      if (!token) throw new Error("Token não disponível");
      return await agendamentoService.listAgendamentosUsuario(token);
    },
    enabled: !!token,
    staleTime: 1 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useAgendamento(id) {
  const { token } = useAuthContext();

  return useQuery({
    queryKey: ["agendamentos", id],
    queryFn: async () => {
      if (!token || !id) throw new Error("Token ou ID não disponível");
      const response = await agendamentoService.getAgendamentoById(token, id);
      return response.success ? response.data : response;
    },
    enabled: !!token && !!id,
    staleTime: 30 * 1000,
    cacheTime: 5 * 60 * 1000,
  });
}

export function useEstatisticasAgendamentos() {
  const { token } = useAuthContext();

  return useQuery({
    queryKey: ["agendamentos", "estatisticas"],
    queryFn: async () => {
      if (!token) throw new Error("Token não disponível");
      const response = await agendamentoService.getEstatisticas(token);
      return response.success ? response.data : response;
    },
    enabled: !!token,
    staleTime: 2 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
  });
}

export function useCreateAgendamento() {
  const { token } = useAuthContext();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (agendamentoData) => {
      if (!token) throw new Error("Token não disponível");
      return await agendamentoService.createAgendamento(token, agendamentoData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agendamentos"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      window.location.reload();
    },
    onError: (error) => {
      console.error(" Erro ao criar agendamento:", error);
    },
  });
}

export function useUpdateAgendamento() {
  const { token } = useAuthContext();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, agendamentoData }) => {
      if (!token) throw new Error("Token não disponível");
      return await agendamentoService.updateAgendamento(
        token,
        id,
        agendamentoData,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agendamentos"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      window.location.reload();
    },
    onError: (error) => {
      console.error(" Erro ao atualizar agendamento:", error);
    },
  });
}

export function useDeleteAgendamento() {
  const { token } = useAuthContext();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      if (!token) throw new Error("Token não disponível");
      return await agendamentoService.deleteAgendamento(token, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agendamentos"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      window.location.reload();
    },
    onError: (error) => {
      console.error(" Erro ao deletar agendamento:", error);
    },
  });
}
