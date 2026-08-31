import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./hooks/useQueryClient";
import { ToastProvider } from "./contexts/ToastContext";
import { AuthProvider } from "./contexts/AuthContext";
import AppRouter from "./routes/AppRouter";
import ToastConfig from "./components/toast/ToastConfig";
import AutoRefreshIndicator from "./components/common/AutoRefreshIndicator";
import { useAutoRefresh } from "./hooks/useAutoRefresh";
import SessionValidator from "./components/auth/SessionValidator";

function AppContent() {
  const { manualRefresh, isActive } = useAutoRefresh(30000);

  return (
    <>
      <AppRouter />
      <ToastConfig />
      <SessionValidator />
      <AutoRefreshIndicator
        isActive={isActive}
        interval={30000}
        onForceRefresh={manualRefresh}
      />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
