import React, { useEffect } from "react";
import DashboardContent from "@/components/dashboard/DashboardContent";
import { useDashboardData } from "@/hooks/useApi.jsx";
import { useAuthContext } from "@/contexts/AuthContext";
import { useDashboardAutoRefresh } from "@/hooks/useAutoRefresh";
import Loader from "@/components/layout/Loader";

export default function DashboardPage() {
  const { user } = useAuthContext();
  const { data: dashboardData, isLoading, error, refetch } = useDashboardData();
  const { afterUpdateDashboard } = useDashboardAutoRefresh();

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
      console.log(" Dashboard atualizado automaticamente");
    }, 120000);
    return () => clearInterval(interval);
  }, [refetch]);

  useEffect(() => {
    const handleDashboardUpdate = () => {
      afterUpdateDashboard();
      console.log(" Dashboard dados atualizados automaticamente");
    };

    window.addEventListener("dashboardUpdate", handleDashboardUpdate);
    return () =>
      window.removeEventListener("dashboardUpdate", handleDashboardUpdate);
  }, [afterUpdateDashboard]);

  if (isLoading) {
    return <Loader message="Carregando Dashboard" />;
  }

  if (error) {
    return <Loader error={error} />;
  }

  return <DashboardContent />;
}
