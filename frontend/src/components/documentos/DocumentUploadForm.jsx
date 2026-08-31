import React, { useState } from "react";
import { arquivoService } from "../../api/services";
import { useAuthContext } from "../../contexts/AuthContext";
import { toastService } from "../../services/toastService";

export default function DocumentUploadForm({
  processoId,
  onSuccess,
  onCancel,
}) {
  const { token, user } = useAuthContext();
  const [formData, setFormData] = useState({
    arquivo: null,
    nome: "",
    descricao: "",
  });
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData((prev) => ({
      ...prev,
      arquivo: file,
      nome: file ? file.name : "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.arquivo) {
      toastService.warning("Por favor, selecione um arquivo");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("arquivo", formData.arquivo);
      form.append("nome", formData.nome || formData.arquivo.name);
      form.append("processo_id", processoId);
      form.append("usuario_id", user.id);
      form.append("descricao", formData.descricao);
      await arquivoService.uploadArquivo(token, form);
      toastService.success("Documento enviado com sucesso!");
      onSuccess();
    } catch (error) {
      console.error("Erro no upload:", error);
      toastService.error(
        "Erro ao enviar documento: " + (error.message || "Erro desconhecido"),
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      style={{
        border: "1px solid #dee2e6",
        borderRadius: "8px",
        padding: "16px",
        backgroundColor: "#f8f9fa",
        marginBottom: "16px",
      }}
    >
      <h4 style={{ margin: "0 0 16px 0", color: "#495057" }}>
        Adicionar Documento ao Processo
      </h4>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "12px" }}>
          <label
            style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}
          >
            Arquivo *
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.xls,.xlsx"
            required
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ced4da",
              borderRadius: "4px",
            }}
          />
          <small style={{ color: "#6c757d" }}>
            Formatos aceitos: PDF, DOC, DOCX, JPG, JPEG, PNG, TXT, XLS, XLSX
            (máx. 10MB)
          </small>
        </div>

        <div style={{ marginBottom: "12px" }}>
          <label
            style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}
          >
            Nome do Documento
          </label>
          <input
            type="text"
            value={formData.nome}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, nome: e.target.value }))
            }
            placeholder="Nome para identificar o documento"
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ced4da",
              borderRadius: "4px",
            }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label
            style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}
          >
            Descrição
          </label>
          <textarea
            value={formData.descricao}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, descricao: e.target.value }))
            }
            placeholder="Descreva o tipo de documento (despacho, ata, petição, etc.)"
            rows="3"
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ced4da",
              borderRadius: "4px",
              resize: "vertical",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="submit"
            disabled={uploading || !formData.arquivo}
            style={{
              backgroundColor: uploading ? "#6c757d" : "#007bff",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: uploading ? "not-allowed" : "pointer",
            }}
          >
            {uploading ? " Enviando..." : " Enviar Documento"}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={uploading}
            style={{
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: uploading ? "not-allowed" : "pointer",
            }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
