import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import { toastService } from "../../services/toastService";

const initialForm = { nome: "", email: "", telefone: "", senha: "", confirmarSenha: "" };
const fieldStyle = { width: "100%", padding: "12px 16px", border: "2px solid #e9ecef", borderRadius: "8px", fontSize: "1rem", outline: "none", boxSizing: "border-box" };
const labelStyle = { display: "block", fontSize: "0.9rem", fontWeight: "bold", color: "#333", marginBottom: "8px" };

function formatPhone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function PublicRegisterForm() {
  const { register } = useAuthContext();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: name === "telefone" ? formatPhone(value) : value }));
  }

  function validate() {
    if (form.nome.trim().length < 2) return toastService.warning("Informe o nome completo."), false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return toastService.warning("Informe um e-mail válido."), false;
    const phoneDigits = form.telefone.replace(/\D/g, "");
    if (phoneDigits && phoneDigits.length < 10) return toastService.warning("Informe um telefone com DDD ou deixe o campo vazio."), false;
    if (form.senha.length < 6) return toastService.warning("A senha deve ter pelo menos 6 caracteres."), false;
    if (form.senha !== form.confirmarSenha) return toastService.warning("A confirmação da senha não corresponde."), false;
    return true;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const result = await register(form.nome.trim(), form.email.trim(), form.senha, form.telefone || null);
    setLoading(false);
    if (!result.success) {
      setForm((current) => ({ ...current, senha: "", confirmarSenha: "" }));
      toastService.error(result.message || "Não foi possível criar a conta.");
      return;
    }
    toastService.success("Conta de aluno criada com sucesso.");
    setForm(initialForm);
    setTimeout(() => navigate("/login"), 1200);
  }

  const fields = [
    { name: "nome", label: "Nome completo", type: "text", autoComplete: "name", placeholder: "Seu nome completo", required: true },
    { name: "email", label: "E-mail", type: "email", autoComplete: "email", placeholder: "seu.email@exemplo.com", required: true },
    { name: "telefone", label: "Telefone (opcional)", type: "tel", autoComplete: "tel", placeholder: "(65) 99999-9999" },
    { name: "senha", label: "Senha", type: "password", autoComplete: "new-password", placeholder: "Mínimo de 6 caracteres", required: true },
    { name: "confirmarSenha", label: "Confirmar senha", type: "password", autoComplete: "new-password", placeholder: "Digite a senha novamente", required: true },
  ];

  return (
    <form onSubmit={handleSubmit} style={{ width: "100%" }} noValidate>
      {fields.map((field) => (
        <div key={field.name} style={{ marginBottom: "18px" }}>
          <label htmlFor={`register-${field.name}`} style={labelStyle}>{field.label}</label>
          <input id={`register-${field.name}`} name={field.name} type={field.type} value={form[field.name]} onChange={updateField} required={field.required} autoComplete={field.autoComplete} placeholder={field.placeholder} style={fieldStyle} />
        </div>
      ))}
      <div style={{ padding: "10px", marginBottom: "18px", borderRadius: "6px", backgroundColor: "#e3f2fd", color: "#145c96", textAlign: "center", fontSize: "0.9rem" }}>
        O cadastro público cria uma conta com perfil de <strong>Aluno</strong>.
      </div>
      <button type="submit" disabled={loading} style={{ width: "100%", padding: "15px", backgroundColor: loading ? "#aeb5bc" : "#28a745", color: "white", border: 0, borderRadius: "8px", fontSize: "1rem", fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer" }}>
        {loading ? "Criando conta..." : "Criar conta de aluno"}
      </button>
    </form>
  );
}
