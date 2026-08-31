import React, { useEffect, useState } from "react";
import { userService, processService } from "../../api/services";
import { useAuthContext } from "../../contexts/AuthContext";

export default function ProcessAssignUserModal({
  processoId,
  onClose,
  onAssigned,
  status,
}) {
  const { token } = useAuthContext();
  const [usuarios, setUsuarios] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      if (!search || search.length < 3) {
        setUsuarios([]);
        return;
      }
      try {
        setSearching(true);
        const data = await userService.getUsersForAssignment(token, search);
        setUsuarios(data);
      } catch {
        setUsuarios([]);
      } finally {
        setSearching(false);
      }
    }
    fetchUsers();
  }, [token, search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    if (!selected) {
      setMsg("Selecione um usuário válido.");
      setLoading(false);
      return;
    }
    try {
      const usuarioId = Number(selected);
      const usuarioObj = usuarios.find((u) => u.id === usuarioId);

      const roleMap = { 3: "Aluno", 2: "Professor", 1: "Admin" };
      const role = usuarioObj ? roleMap[usuarioObj.role_id] : null;

      if (!usuarioObj || !usuarioObj.role_id || !role) {
        setMsg(
          "Usuário selecionado inválido ou role não permitida para vinculação.",
        );
        setLoading(false);
        return;
      }
      await processService.assignUserToProcess(
        token,
        processoId,
        usuarioId,
        role,
      );
      setMsg("Usuário vinculado com sucesso!");
      setSelected("");
      if (onAssigned) onAssigned();
      setTimeout(() => {
        setMsg("");
        if (onClose) onClose();
      }, 1000);
    } catch (err) {
      setMsg(err.message || "Erro ao vincular usuário.");
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 8,
        padding: 24,
        boxShadow: "0 2px 8px #0002",
        width: "min(520px, calc(100vw - 32px))",
      }}
    >
      <h3 style={{ marginTop: 0 }}>Vincular Usuário ao Processo</h3>
      <p style={{ color: "#6c757d", fontSize: 14 }}>
        Pesquise pelo nome ou e-mail e selecione uma pessoa nos resultados.
      </p>
      {msg && <div role="alert" style={{ marginBottom: 12, color: msg.includes("sucesso") ? "#198754" : "#dc3545" }}>{msg}</div>}
      {status !== "Concluído" ? (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Digite ao menos 3 caracteres"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              marginBottom: 8,
              padding: 10,
              borderRadius: 4,
              border: "1px solid #ccc",
            }}
          />
          <div style={{ maxHeight: 240, overflowY: "auto", marginBottom: 16 }}>
            {searching && <div style={{ padding: 12 }}>Buscando usuários...</div>}
            {!searching && search.length >= 3 && usuarios.length === 0 && (
              <div style={{ padding: 12, color: "#6c757d" }}>Nenhum usuário disponível encontrado.</div>
            )}
            {usuarios.map((u) => (
              <label key={u.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: 12, border: selected === String(u.id) ? "2px solid #1976d2" : "1px solid #dee2e6", borderRadius: 6, marginBottom: 8, cursor: "pointer" }}>
                <input type="radio" name="usuario" value={u.id} checked={selected === String(u.id)} onChange={(e) => setSelected(e.target.value)} />
                <span style={{ minWidth: 0 }}>
                  <strong style={{ display: "block", overflowWrap: "anywhere" }}>{u.nome}</strong>
                  <span style={{ fontSize: 13, color: "#6c757d", overflowWrap: "anywhere" }}>{u.email}</span>
                </span>
              </label>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={!selected || loading}
              style={{
                background: "#1976d2",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                padding: "6px 16px",
                fontWeight: 500,
                fontSize: 15,
                cursor: "pointer",
              }}
            >
              Vincular
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "#aaa",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                padding: "6px 16px",
                fontWeight: 500,
                fontSize: 15,
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <div style={{ color: "#d32f2f", marginTop: 16 }}>
          Processo concluído. Não é possível vincular usuários.
        </div>
      )}
    </div>
  );
}
