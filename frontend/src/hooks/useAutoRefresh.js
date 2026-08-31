import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";

export function useAutoRefresh(interval = 30000, enabled = true) {
  const queryClient = useQueryClient();
  const intervalRef = useRef(null);
  const isActiveRef = useRef(true);

  const refreshData = useCallback(
    (queryKeys) => {
      const defaultQueries = [
        "processos",
        "usuarios",
        "agendamentos",
        "dashboard",
        "notificacoes",
        "arquivos",
      ];
      const safeQueryKeys = Array.isArray(queryKeys)
        ? queryKeys
        : queryKeys
          ? [queryKeys]
          : [];
      const allQueries = [...defaultQueries, ...safeQueryKeys];

      setTimeout(() => {
        allQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        });
      }, 500);
    },
    [queryClient],
  );

  const startAutoRefresh = useCallback(() => {
    if (!enabled) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (isActiveRef.current) {
      refreshData();
    }

    intervalRef.current = setInterval(() => {
      if (isActiveRef.current && document.visibilityState === "visible") {
        console.log(` Auto-refresh executado (${interval / 1000}s)`);
        refreshData();
      }
    }, interval);

  }, [refreshData, interval, enabled]);

  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    isActiveRef.current = true;
    startAutoRefresh();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        isActiveRef.current = true;
        startAutoRefresh();
      } else {
        isActiveRef.current = false;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isActiveRef.current = false;
      stopAutoRefresh();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [startAutoRefresh, stopAutoRefresh]);

  const afterCreate = useCallback(
    (entity, specificQueries = []) => {
      refreshData(specificQueries);
    },
    [refreshData],
  );

  const afterUpdate = useCallback(
    (entity, specificQueries = []) => {
      refreshData(specificQueries);
    },
    [refreshData],
  );

  const afterDelete = useCallback(
    (entity, specificQueries = []) => {
      refreshData(specificQueries);
    },
    [refreshData],
  );

  const manualRefresh = useCallback(
    (specificQueries = []) => {
      refreshData(specificQueries);
    },
    [refreshData],
  );

  return {
    refreshData,
    afterCreate,
    afterUpdate,
    afterDelete,
    manualRefresh,
    startAutoRefresh,
    stopAutoRefresh,
    isActive: isActiveRef.current,
  };
}

export function useProcessoAutoRefresh(interval = 30000) {
  const { afterCreate, afterUpdate, afterDelete, manualRefresh } =
    useAutoRefresh(interval);
  return {
    afterCreateProcesso: () => afterCreate("processo", ["processos"]),
    afterUpdateProcesso: () => afterUpdate("processo", ["processos"]),
    afterDeleteProcesso: () => afterDelete("processo", ["processos"]),
    afterConcluirProcesso: () => afterUpdate("processo", ["processos"]),
    afterReabrirProcesso: () => afterUpdate("processo", ["processos"]),
    refreshProcessos: () => manualRefresh(["processos"]),
  };
}

export function useUsuarioAutoRefresh(interval = 30000) {
  const { afterCreate, afterUpdate, afterDelete, manualRefresh } =
    useAutoRefresh(interval);
  return {
    afterCreateUsuario: () => afterCreate("usuário", ["usuarios"]),
    afterUpdateUsuario: () => afterUpdate("usuário", ["usuarios"]),
    afterDeleteUsuario: () => afterDelete("usuário", ["usuarios"]),
    afterSoftDeleteUsuario: () => afterUpdate("usuário", ["usuarios"]),
    afterReactivateUsuario: () => afterUpdate("usuário", ["usuarios"]),
    refreshUsuarios: () => manualRefresh(["usuarios"]),
  };
}

export function useAgendamentoAutoRefresh(interval = 30000) {
  const { afterCreate, afterUpdate, afterDelete, manualRefresh } =
    useAutoRefresh(interval);
  return {
    afterCreateAgendamento: () => afterCreate("agendamento", ["agendamentos"]),
    afterUpdateAgendamento: () => afterUpdate("agendamento", ["agendamentos"]),
    afterDeleteAgendamento: () => afterDelete("agendamento", ["agendamentos"]),
    afterSincronizarGoogle: () => afterUpdate("agendamento", ["agendamentos"]),
    refreshAgendamentos: () => manualRefresh(["agendamentos"]),
  };
}

export function useArquivoAutoRefresh(interval = 30000) {
  const { afterCreate, afterUpdate, afterDelete, manualRefresh } =
    useAutoRefresh(interval);
  return {
    afterUploadArquivo: () => afterCreate("arquivo", ["arquivos"]),
    afterDeleteArquivo: () => afterDelete("arquivo", ["arquivos"]),
    refreshArquivos: () => manualRefresh(["arquivos"]),
  };
}

export function useNotificacaoAutoRefresh(interval = 30000) {
  const { afterCreate, afterUpdate, afterDelete, manualRefresh } =
    useAutoRefresh(interval);
  return {
    afterMarcarLida: () => afterUpdate("notificacao", ["notificacoes"]),
    afterMarcarTodasLidas: () => afterUpdate("notificacao", ["notificacoes"]),
    afterDeleteNotificacao: () => afterDelete("notificacao", ["notificacoes"]),
    refreshNotificacoes: () => manualRefresh(["notificacoes"]),
  };
}

export function useDashboardAutoRefresh(interval = 30000) {
  const { refreshData, manualRefresh } = useAutoRefresh(interval);
  return {
    afterUpdateDashboard: () =>
      refreshData([
        "dashboard",
        "estatisticas",
        "processos",
        "usuarios",
        "agendamentos",
      ]),
    refreshDashboard: () => manualRefresh(["dashboard"]),
  };
}

export default useAutoRefresh;
