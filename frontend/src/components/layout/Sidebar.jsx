import React from "react";
import { Link } from "react-router-dom";
import LogoutButton from "../auth/LogoutButton";
import { useAuthContext } from "../../contexts/AuthContext";
import { hasRole } from "../../utils/permissions";

const Sidebar = () => {
  const { user } = useAuthContext();
  return (
    <aside className="sidebar">
      <nav>
        <ul>
          <li>
            <Link to="/dashboard">Dashboard</Link>
          </li>
          <li>
            <Link to="/processos">Processos</Link>
          </li>
          <li>
            <Link to="/agendamentos">Agendamentos</Link>
          </li>
          <li>
            <Link to="/arquivos">Meus Arquivos</Link>
          </li>
          <li>
            <Link to="/profile">Meu Perfil</Link>
          </li>
          {hasRole(user, ["Admin", "Professor"]) && (
            <li>
              <Link to="/usuarios">Usuários</Link>
            </li>
          )}
          <li>
            <LogoutButton />
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
