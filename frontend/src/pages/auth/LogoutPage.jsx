import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";

const LogoutPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuthContext();

  useEffect(() => {
    logout();
    navigate("/login");
  }, [logout, navigate]);

  return <div>Saindo...</div>;
};

export default LogoutPage;
