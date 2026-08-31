import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { apiRequest } from "@/api/apiRequest";
import FullProcessCreateForm from "@/components/FullProcessCreateForm";
import Loader from "@/components/layout/Loader";
import { toastAudit } from "@/services/toastSystemAudit";

export default function ProcessEditPage() {
  const { id } = useParams();
  const { token } = useAuthContext();
  const [initialData, setInitialData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProcess() {
      try {
        const response = await apiRequest(`/api/processos/${id}/detalhes`, {
          token,
        });
        const process = response.data;
        setInitialData({
          ...process,
          materia_assunto_id:
            process.materia_assunto_id || process.materiaAssunto?.id || "",
          fase_id: process.fase_id || process.fase?.id || "",
          diligencia_id: process.diligencia_id || process.diligencia?.id || "",
          local_tramitacao_id:
            process.local_tramitacao_id || process.localTramitacao?.id || "",
          idusuario_responsavel:
            process.idusuario_responsavel ||
            process.usuario_responsavel?.id ||
            "",
        });
      } catch (loadError) {
        const message = loadError.message || "Erro ao carregar o processo";
        setError(message);
        toastAudit.error(message);
      }
    }
    loadProcess();
  }, [id, token]);

  if (error) return <Loader error={error} />;
  if (!initialData) return <Loader message="Carregando processo..." />;

  return (
    <FullProcessCreateForm
      mode="edit"
      processId={id}
      initialData={initialData}
    />
  );
}
