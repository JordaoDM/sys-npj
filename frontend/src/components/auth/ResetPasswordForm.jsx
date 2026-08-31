import React, { useState } from "react";
import useApi from "../../hooks/useApi.jsx";

const ResetPasswordForm = () => {
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const { request, loading, error } = useApi();
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = await request("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    if (data) setSuccess(true);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Redefinir Senha</h2>
      <input
        type="text"
        placeholder="Token"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Nova Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit" disabled={loading}>
        Redefinir
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p>Senha alterada com sucesso!</p>}
    </form>
  );
};

export default ResetPasswordForm;
