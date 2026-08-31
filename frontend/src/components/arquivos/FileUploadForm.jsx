import React, { useRef, useState } from "react";
import { useAuthContext } from "../../contexts/AuthContext";
import { arquivoService } from "../../api/services";
import { toastService } from "../../services/toastService";

export default function FileUploadForm({ processoId, onUpload }) {
  const { token, user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const fileInput = useRef();

  const validateFile = (file) => {
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toastService.warning("Arquivo muito grande. Tamanho máximo: 10MB");
      return false;
    }

    const allowedTypes = [
      "image/",
      "application/pdf",
      "text/",
      "application/msword",
      "application/vnd.openxmlformats-officedocument",
    ];
    const isAllowedType = allowedTypes.some((type) =>
      file.type.startsWith(type),
    );
    if (!isAllowedType && file.type !== "") {
      toastService.warning(
        "Tipo de arquivo não permitido. Use imagens, PDFs, documentos de texto ou Word",
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const file = fileInput.current.files[0];
    if (!file) {
      toastService.warning("Selecione um arquivo para enviar");
      setLoading(false);
      return;
    }

    if (!validateFile(file)) {
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("nome", file.name);
    formData.append("arquivo", file);
    if (processoId) formData.append("processo_id", processoId);
    if (user?.id) formData.append("usuario_id", user.id);

    try {
      await arquivoService.uploadArquivo(token, formData);
      toastService.fileUploaded(file.name);
      fileInput.current.value = "";
      if (onUpload) onUpload();
    } catch (err) {
      if (err.message?.includes("size") || err.message?.includes("tamanho")) {
        toastService.error(
          "Arquivo muito grande. Reduza o tamanho e tente novamente",
        );
      } else if (
        err.message?.includes("type") ||
        err.message?.includes("formato")
      ) {
        toastService.error("Formato de arquivo não suportado");
      } else if (
        err.message?.includes("space") ||
        err.message?.includes("espaço")
      ) {
        toastService.error(
          "Espaço insuficiente. Entre em contato com o administrador",
        );
      } else {
        toastService.error(
          `Erro ao enviar arquivo: ${err.message || "Erro inesperado"}`,
        );
      }
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} encType="multipart/form-data">
      <h5>Anexar novo arquivo</h5>
      <input type="file" ref={fileInput} required />
      <button type="submit" disabled={loading}>
        {loading ? "Enviando..." : "Enviar"}
      </button>
    </form>
  );
}
