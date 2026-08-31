import React, { useState } from "react";
import { useAuthContext } from "../../contexts/AuthContext";

export default function ForgotPasswordForm() {
  const { forgotPassword } = useAuthContext();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    const res = await forgotPassword(email);
    if (res.success) {
      setMsg(
        "Se o e-mail estiver cadastrado, você receberá instruções para redefinir a senha.",
      );
    } else {
      setMsg(res.message || "Erro ao solicitar redefinição de senha.");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Esqueci minha senha</h2>
      {msg && <div>{msg}</div>}
      <div>
        <label>E-mail cadastrado:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <button type="submit" disabled={loading}>
        {loading ? "Enviando..." : "Enviar"}
      </button>
    </form>
  );
}
