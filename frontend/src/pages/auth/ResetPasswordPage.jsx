import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { apiRequest } from "../../api/apiRequest";
import Button from "@/components/common/Button";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";
  const [senha, setSenha] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token) {
    return <div>Token inválido. Verifique o link enviado por e-mail.</div>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    if (senha !== confirm) {
      setMsg("A nova senha e a confirmação não coincidem.");
      return;
    }
    setLoading(true);
    try {
      await apiRequest("/api/auth/resetar-senha", {
        method: "POST",
        body: { token, nova_senha: senha },
      });
      setMsg("Senha redefinida com sucesso! Redirecionando para login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setMsg(err.message || "Erro ao redefinir senha.");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Redefinir senha</h2>
      {msg && (
        <div style={{ color: msg.includes("sucesso") ? "green" : "red" }}>
          {msg}
        </div>
      )}
      <div>
        <label>Nova senha:</label>
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          minLength={6}
        />
      </div>
      <div>
        <label>Confirmar nova senha:</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={6}
        />
      </div>
      <Button type="submit" variant="primary" disabled={loading}>
        {loading ? "Alterando..." : "Alterar senha"}
      </Button>
    </form>
  );
}
