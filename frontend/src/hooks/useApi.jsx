import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../api/apiRequest";
import { useAuthContext } from "../contexts/AuthContext";
import { requestCache } from "../utils/requestCache";

export const getUserRole = (user) => {
  return user?.role || null;
};


export function useProcessos(
  search = "",
  showMyProcesses = false,
  page = 1,
  limit = 4,
  showConcluidos = false,
) {
  const { token, user } = useAuthContext();

  return useQuery({
    queryKey: [
      "processos",
      user?.id,
      getUserRole(user),
      search,
      showMyProcesses,
      page,
      limit,
      showConcluidos,
    ],
    queryFn: async () => {
      const userRole = getUserRole(user);
      if (!token || !userRole)
        throw new Error("Token ou usuário não disponível");

      let endpoint = "";
      let params = new URLSearchParams();

      params.append("page", page.toString());
      params.append("limit", limit.toString());

      if (showConcluidos) {
        params.append("concluidos", "true");
      }

      if (userRole === "Aluno") {
        endpoint = "/api/processos/usuario";
      } else if (userRole === "Professor") {
        if (showMyProcesses) {
          endpoint = "/api/processos/usuario";
        } else {
          endpoint = "/api/processos";
          if (limit === 4 && page === 1 && !search.trim() && !showConcluidos) {
            params.append("recent", "true");
          }
        }
      } else if (userRole === "Admin") {
        if (showMyProcesses) {
          endpoint = "/api/processos/usuario";
        } else {
          endpoint = "/api/processos";
          if (limit === 4 && page === 1 && !search.trim() && !showConcluidos) {
            params.append("recent", "true");
          }
        }
      }

      const response = await apiRequest(`${endpoint}?${params.toString()}`, {
        token,
      });

      let data = response.data;

      if (search.trim()) {
        data = data.filter(
          (proc) =>
            proc.numero_processo
              ?.toLowerCase()
              .includes(search.toLowerCase()) ||
            proc.numero?.toLowerCase().includes(search.toLowerCase()),
        );

        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedData = data.slice(startIndex, endIndex);

        return {
          processos: paginatedData,
          totalItems: data.length,
          currentPage: page,
          totalPages: Math.ceil(data.length / limit),
          hasMore: endIndex < data.length,
        };
      }

      return {
        processos: data,
        totalItems: response.pagination.total,
        currentPage: response.pagination.page,
        totalPages: response.pagination.totalPages,
        hasMore: response.pagination.hasMore,
      };
    },
    enabled: !!(token && user),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}


export function useDashboardData() {
  const { token, user } = useAuthContext();

  return useQuery({
    queryKey: ["dashboard", user?.id, getUserRole(user)],
    queryFn: async () => {
      const userRole = getUserRole(user);
      if (!token || !userRole) {
        throw new Error(`Token ou usuário não disponível`);
      }


      try {
        const dashboardResponse = await apiRequest("/api/dashboard", { token });
        const dashboardData = dashboardResponse.data;


        return {
          processosTotal: dashboardData.processosTotal || 0,
          processosAtivos: dashboardData.processosAtivos || 0,
          processosPorStatus: dashboardData.processosPorStatus || {},

          totalUsuarios: dashboardData.totalUsuarios || 0,
          usuariosAtivos: dashboardData.usuariosAtivos || 0,
          usuariosPorTipo: dashboardData.usuariosPorTipo || {},

          totalArquivos: dashboardData.totalArquivos || 0,

          agendamentosTotal: dashboardData.agendamentosTotal || 0,
          agendamentosPorTipo: dashboardData.agendamentosPorTipo || {},
          agendamentosPorStatus: dashboardData.agendamentosPorStatus || {},

          userRole: dashboardData.userRole || userRole,
          ultimaAtualizacao: dashboardData.ultimaAtualizacao,
          estatisticas: dashboardData.estatisticas || {},

          processos: dashboardData.processos || [],
          agendamentos: dashboardData.agendamentos || [],
          usuarios: dashboardData.usuarios || [],

        };
      } catch (error) {
        console.error(` Erro ao buscar dados do dashboard:`, error);

        return {
          processosTotal: 0,
          processosAtivos: 0,
          processosPorStatus: {},
          totalUsuarios: 0,
          usuariosAtivos: 0,
          usuariosPorTipo: {},
          agendamentosTotal: 0,
          agendamentosPorTipo: {},
          agendamentosPorStatus: {},
          userRole: userRole,
          ultimaAtualizacao: new Date().toISOString(),
          estatisticas: {},
          processos: [],
          agendamentos: [],
          usuarios: [],
          message: error.message,
        };
      }
    },
    enabled: !!(token && user),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: true,
    refetchInterval: 1000 * 60 * 2,
  });
}


export function useUsuarios(search = "") {
  const { token, user } = useAuthContext();

  return useQuery({
    queryKey: ["usuarios", getUserRole(user), search],
    queryFn: async () => {
      const userRole = getUserRole(user);
      if (!token || !userRole)
        throw new Error("Token ou usuário não disponível");

      if (userRole === "Aluno") {
        throw new Error("Acesso negado. Alunos não podem listar usuários.");
      }

      let endpoint = "/api/usuarios";

      const response = await apiRequest(endpoint, { token });
      let data = response.data;

      if (search.trim()) {
        data = data.filter(
          (usuario) =>
            usuario.nome?.toLowerCase().includes(search.toLowerCase()) ||
            usuario.email?.toLowerCase().includes(search.toLowerCase()),
        );
      }

      return data;
    },
    enabled: !!(token && user),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
  });
}

export function useUsuario(id) {
  const { token } = useAuthContext();

  return useQuery({
    queryKey: ["usuario", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiRequest(`/api/usuarios/${id}`, { token });
      return response.data;
    },
    enabled: !!(token && id),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}


export function useCreateUsuario() {
  const { token } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData) => {
      return await apiRequest("/api/usuarios", {
        method: "POST",
        token,
        body: userData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });

      console.log(" Usuário criado - dados atualizados automaticamente");
    },
  });
}

export function useUpdateUsuario() {
  const { token } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...userData }) => {
      return await apiRequest(`/api/usuarios/${id}`, {
        method: "PUT",
        token,
        body: userData,
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["usuario", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });

      console.log(" Usuário atualizado - dados atualizados automaticamente");
    },
  });
}

export function useDeleteUsuario() {
  const { token } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      return await apiRequest(`/api/usuarios/${id}`, {
        method: "DELETE",
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });

      console.log(" Usuário removido - dados atualizados automaticamente");
    },
  });
}

export function useCreateProcesso() {
  const { token } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (processoData) => {
      return await apiRequest("/api/processos", {
        method: "POST",
        token,
        body: processoData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processos"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });

      console.log(" Processo criado - dados atualizados automaticamente");
    },
  });
}

export function useUpdateProcesso() {
  const { token } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...processoData }) => {
      return await apiRequest(`/api/processos/${id}`, {
        method: "PUT",
        token,
        body: processoData,
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["processo", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["processos"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });

      console.log(" Processo atualizado - dados atualizados automaticamente");
    },
  });
}

