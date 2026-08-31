import React from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: (failureCount, error) => {
        if (
          error?.status >= 400 &&
          error?.status < 500 &&
          error?.status !== 429
        ) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      networkTimeout: 10000,
    },
  },
});

export const QueryProvider = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

export const useInvalidateQueries = () => {
  const queryClient = useQueryClient();

  const invalidateUserQueries = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }, [queryClient]);

  const invalidateProcessQueries = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["processos"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }, [queryClient]);

  const invalidateFileQueries = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["arquivos"] });
  }, [queryClient]);

  const invalidateAll = React.useCallback(() => {
    queryClient.invalidateQueries();
  }, [queryClient]);

  return {
    invalidateUserQueries,
    invalidateProcessQueries,
    invalidateFileQueries,
    invalidateAll,
  };
};

export default queryClient;
