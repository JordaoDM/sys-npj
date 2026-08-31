export const FIELD_LABELS = {
  materia_assunto_id: "Matéria/Assunto",
  fase_id: "Fase",
  diligencia_id: "Diligência",
  local_tramitacao_id: "Local de Tramitação",
  status: "Status",
  descricao: "Descrição",
  assistido: "Assistido(a)",
  contato_assistido: "Contato do Assistido",
  num_processo_sei: "Nº Processo/SEI",
  numero_processo: "Número do Processo",
};

export function getFieldDisplayValue(field, value, auxData) {
  if (!value) return "-";
  switch (field) {
    case "materia_assunto_id":
      return auxData.materias?.find((m) => m.id == value)?.nome || value;
    case "fase_id":
      return auxData.fases?.find((f) => f.id == value)?.nome || value;
    case "diligencia_id":
      return auxData.diligencias?.find((d) => d.id == value)?.nome || value;
    case "local_tramitacao_id":
      return (
        auxData.localTramitacoes?.find((l) => l.id == value)?.nome || value
      );
    default:
      return value;
  }
}
