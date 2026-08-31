import React from "react";

const ProcessRemoveStudentButton = ({ onRemove, disabled, status }) =>
  status !== "Concluído" ? (
    <button onClick={onRemove} disabled={disabled} style={{ color: "red" }}>
      Remover aluno
    </button>
  ) : null;

export default ProcessRemoveStudentButton;
