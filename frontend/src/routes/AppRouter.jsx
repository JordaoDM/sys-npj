import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import AgendamentoCreatePage from "@/pages/agendamentos/AgendamentoCreatePage";
import AgendamentoEditPage from "@/pages/agendamentos/AgendamentoEditPage";
import AgendamentoDetailPage from "@/pages/agendamentos/AgendamentoDetailPage";
import { useAuthContext } from "@/contexts/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import HomePage from "@/pages/HomePage";
import ProfilePage from "@/pages/dashboard/ProfilePage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import ProcessListPage from "@/pages/dashboard/ProcessListPage";
import ProcessDetailPage from "../pages/dashboard/ProcessDetailPage";
import ProcessFormPage from "@/pages/dashboard/ProcessFormPage";
import ProcessEditPage from "../pages/dashboard/ProcessEditPage";
import ProcessAssignStudentPage from "@/pages/dashboard/ProcessAssignStudentPage";
import ProcessUpdatesPage from "@/pages/dashboard/ProcessUpdatePage";
import UserListPage from "@/pages/dashboard/UserListPage";
import UserDetailPage from "@/pages/dashboard/UserDetailPage";
import UserEditPage from "@/pages/dashboard/UserEditPage";
import ArquivosPage from "@/pages/dashboard/ArquivosPage";
import AgendamentosPage from "@/pages/agendamentos/AgendamentosPage";
import AceitarConvitePage from "@/pages/convite/AceitarConvitePage";
import RecusarConvitePage from "@/pages/convite/RecusarConvitePage";
import ConviteVisualizacao from "@/pages/convite/ConviteVisualizacao";
import NotFoundPage from "@/pages/NotFoundPage";
import { hasRole } from "@/utils/permissions";

function PrivateRoute({ children, roles }) {
  const { isAuthenticated, user, loading } = useAuthContext();

  if (loading) return <div>Carregando...</div>;

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (roles) {
    const hasPermission = hasRole(user, roles);

    if (!hasPermission) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <MainLayout>{children}</MainLayout>;
}

export default function AppRouter() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
        <Route path="/resetar-senha" element={<ResetPasswordPage />} />

        <Route path="/convite/:id/aceitar" element={<AceitarConvitePage />} />
        <Route path="/convite/:id/recusar" element={<RecusarConvitePage />} />
        <Route path="/convite/:id" element={<ConviteVisualizacao />} />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/arquivos"
          element={
            <PrivateRoute>
              <ArquivosPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/agendamentos"
          element={
            <PrivateRoute>
              <AgendamentosPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/agendamentos/novo"
          element={
            <PrivateRoute>
              <AgendamentoCreatePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/agendamentos/:id"
          element={
            <PrivateRoute>
              <AgendamentoDetailPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/agendamentos/:id/editar"
          element={
            <PrivateRoute>
              <AgendamentoEditPage />
            </PrivateRoute>
          }
        />


        <Route
          path="/usuarios"
          element={
            <PrivateRoute roles={["Professor", "Admin"]}>
              <UserListPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/usuarios/:id"
          element={
            <PrivateRoute roles={["Professor", "Admin"]}>
              <UserDetailPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/usuarios/:id/editar"
          element={
            <PrivateRoute roles={["Professor", "Admin"]}>
              <UserEditPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/processos"
          element={
            <PrivateRoute>
              <ProcessListPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/processos/:id"
          element={
            <PrivateRoute>
              <ProcessDetailPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/processos/:id/atualizacoes"
          element={
            <PrivateRoute>
              <ProcessUpdatesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/processos/:id/editar"
          element={
            <PrivateRoute>
              <ProcessEditPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/processos/novo"
          element={
            <PrivateRoute roles={["Professor", "Admin"]}>
              <ProcessFormPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/processos/:id/atribuir"
          element={
            <PrivateRoute roles={["Professor", "Admin"]}>
              <ProcessAssignStudentPage />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}
