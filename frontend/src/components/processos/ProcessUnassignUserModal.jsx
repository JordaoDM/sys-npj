import React, { useState } from "react";
import { processService } from "../../api/services";
import { useAuthContext } from "../../contexts/AuthContext";

export default function ProcessUnassignUserModal({
  processoId,
  alunos,
  onClose,
  onUnassigned,
  status,
}) {
  const { token } = useAuthContext();
  const [selected, setSelected] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      await processService.removeUserFromProcess(
        token,
        processoId,
        Number(selected),
      );
      setMsg("Usuário desvinculado com sucesso!");
      setSelected("");
      if (onUnassigned) onUnassigned();
      setTimeout(() => {
        setMsg("");
        if (onClose) onClose();
      }, 1000);
    } catch (err) {
      setMsg(err.message || "Erro ao desvincular usuário.");
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
        maxWidth: 400,
      }}
    >
      <h3>Desvincular Usuário do Processo</h3>
      {msg && <div style={{ marginBottom: 8 }}>{msg}</div>}
      {status !== "Concluído" ? (
        <form onSubmit={handleSubmit}>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            required
            style={{ width: "100%", marginBottom: 8 }}
          >
            <option value="">Selecione um usuário vinculado</option>
            {alunos.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome} ({u.email})
              </option>
            ))}
          </select>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="submit"
              disabled={!selected || loading}
              style={{
                background: "#d32f2f",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                padding: "6px 16px",
                fontWeight: 500,
                fontSize: 15,
                cursor: "pointer",
              }}
            >
              Desvincular
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
          Processo concluído. Não é possível desvincular usuários.
        </div>
      )}
    </div>
  );
}
