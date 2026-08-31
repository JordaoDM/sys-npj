import React, { useState } from "react";
import { userService } from "../../api/services";
import { useAuthContext } from "../../contexts/AuthContext";
import { getUserRole } from "../../hooks/useApi";
import { toastAudit } from "../../services/toastSystemAudit";

const ROLES = [
  { id: 3, label: "Aluno" },
  { id: 2, label: "Professor" },
  { id: 1, label: "Administrador" },
];

export default function UserCreateForm({ onCreated }) {
  const { token, user } = useAuthContext();
  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    telefone: "",
    role_id: 3,
  });
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!form.nome.trim()) {
      toastAudit.validation.requiredField("Nome");
      return false;
    }
    if (form.nome.trim().length < 2) {
      toastAudit.warning("Nome deve ter pelo menos 2 caracteres");
      return false;
    }
    if (!form.email.trim()) {
      toastAudit.validation.requiredField("E-mail");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toastAudit.validation.invalidEmail();
      return false;
    }
    if (!form.senha.trim()) {
      toastAudit.validation.requiredField("Senha");
      return false;
    }
    if (form.senha.length < 6) {
      toastAudit.validation.passwordTooShort();
      return false;
    }
    return true;
  };

  const userRole = getUserRole(user);
  const isProfessor = userRole === "Professor";
  const isAdmin = userRole === "Admin";

  let roleOptions = [];
  if (isAdmin) {
    roleOptions = ROLES;
  } else if (isProfessor) {
    roleOptions = ROLES.filter((r) => r.id !== 1);
  } else {
    roleOptions = ROLES.filter((r) => r.id === 3);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await userService.createUser(token, form);
      toastAudit.user.createSuccess(form.nome);
      setForm({ nome: "", email: "", senha: "", telefone: "", role_id: 3 });
      if (onCreated) onCreated();
    } catch (err) {
      toastAudit.user.createError(err.message || "Erro inesperado");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: "auto" }}>
      <h2>Criar Usuário</h2>
      <div>
        <label>Nome:</label>
        <input name="nome" value={form.nome} onChange={handleChange} required />
      </div>
      <div>
        <label>Email:</label>
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label>Senha:</label>
        <input
          name="senha"
          type="password"
          value={form.senha}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label>Telefone:</label>
        <input name="telefone" value={form.telefone} onChange={handleChange} />
      </div>
      {roleOptions.length > 1 ? (
        <div>
          <label>Papel:</label>
          <select
            name="role_id"
            value={form.role_id}
            onChange={handleChange}
            required
          >
            {roleOptions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div>
          <label>Papel:</label>
          <input
            type="text"
            value={roleOptions[0]?.label || "Aluno"}
            disabled
          />
          <input type="hidden" name="role_id" value={roleOptions[0]?.id || 3} />
        </div>
      )}
      <button type="submit" disabled={loading} style={{ marginTop: 16 }}>
        {loading ? "Cadastrando..." : "Cadastrar"}
      </button>
    </form>
  );
}
