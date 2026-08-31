
import { toastAudit } from "../services/toastSystemAudit";

export const processValidationRules = {
  numero_processo: {
    required: true,
    minLength: 5,
    pattern: /^[\d.\-/]+$/,
    validate: (value) => {
      const digits = String(value || "").replace(/\D/g, "");
      if (digits.length < 5) {
        return "Número do processo deve ter pelo menos 5 dígitos";
      }
      return null;
    },
    message:
      "Número do processo deve conter apenas números, pontos, hífens ou barras",
  },
  titulo: {
    required: true,
    minLength: 5,
    maxLength: 200,
    message: "Título deve ter entre 5 e 200 caracteres",
  },
  descricao: {
    required: true,
    minLength: 10,
    maxLength: 1000,
    message: "Descrição deve ter entre 10 e 1000 caracteres",
  },
  tipo_processo: {
    required: false,
    minLength: 3,
    maxLength: 50,
    message: "Tipo do processo deve ter entre 3 e 50 caracteres",
  },
  num_processo_sei: {
    required: false,
    pattern: /^(SEI-)?[\d\.\/-]+$/,
    message: "Número SEI deve seguir o padrão: SEI-23085.012345/2025-67",
  },
  assistido: {
    required: false,
    minLength: 3,
    maxLength: 100,
    message: "Nome do assistido deve ter entre 3 e 100 caracteres",
  },
  contato_assistido: {
    required: true,
    pattern:
      /^[\w\.\-_]+@[\w\.\-_]+\.[A-Za-z]{2,}$|^\(\d{2}\)\s\d{4,5}-\d{4}$|^\d{10,11}$/,
    message: "Contato deve ser um email válido ou telefone (11) 99999-9999",
  },
  status: {
    required: true,
    options: ["Em andamento", "Concluído", "Suspenso", "Arquivado"],
    message: "Status deve ser selecionado",
  },
  sistema: {
    required: true,
    options: ["Físico", "PEA", "PJE"],
    message: "Sistema deve ser selecionado",
  },
  data_encerramento: {
    required: false,
    validate: (value, formData) => {
      if (value && formData.status !== "Concluído") {
        return "Data de encerramento só deve ser preenchida para processos concluídos";
      }
      if (formData.status === "Concluído" && !value) {
        return "Data de encerramento é obrigatória para processos concluídos";
      }
      if (value && new Date(value) > new Date()) {
        return "Data de encerramento não pode ser no futuro";
      }
      return null;
    },
  },
  materia_assunto_id: {
    required: true,
    message: "Matéria/Assunto deve ser selecionada",
  },
  fase_id: {
    required: true,
    message: "Fase deve ser selecionada",
  },
  diligencia_id: {
    required: true,
    message: "Diligência deve ser selecionada",
  },
  local_tramitacao_id: {
    required: true,
    message: "Local de Tramitação deve ser selecionado",
  },
};

export const validateProcessForm = (formData, isEditing = false) => {
  const errors = {};
  let isValid = true;

  Object.keys(processValidationRules).forEach((fieldName) => {
    const rule = processValidationRules[fieldName];
    const value = formData[fieldName];
    const normalizedValue = value == null ? "" : String(value).trim();

    if (rule.required && (!value || normalizedValue === "")) {
      errors[fieldName] = `${getFieldLabel(fieldName)} é obrigatório`;
      isValid = false;
      return;
    }

    if (!value || normalizedValue === "") {
      return;
    }

    if (rule.minLength && normalizedValue.length < rule.minLength) {
      errors[fieldName] =
        `${getFieldLabel(fieldName)} deve ter pelo menos ${rule.minLength} caracteres`;
      isValid = false;
      return;
    }

    if (rule.maxLength && normalizedValue.length > rule.maxLength) {
      errors[fieldName] =
        `${getFieldLabel(fieldName)} deve ter no máximo ${rule.maxLength} caracteres`;
      isValid = false;
      return;
    }

    if (rule.pattern && !rule.pattern.test(normalizedValue)) {
      errors[fieldName] = rule.message;
      isValid = false;
      return;
    }

    if (rule.options && !rule.options.includes(value)) {
      errors[fieldName] = rule.message;
      isValid = false;
      return;
    }

    if (rule.validate) {
      const customError = rule.validate(value, formData);
      if (customError) {
        errors[fieldName] = customError;
        isValid = false;
        return;
      }
    }
  });


  if (formData.status === "Concluído" && !formData.data_encerramento) {
    errors.data_encerramento =
      "Data de encerramento é obrigatória para processos concluídos";
    isValid = false;
  }

  if (formData.data_encerramento && formData.status !== "Concluído") {
    errors.data_encerramento =
      "Data de encerramento só deve ser preenchida para processos concluídos";
    isValid = false;
  }

  return { isValid, errors };
};

export const showValidationErrors = (errors) => {
  const errorFields = Object.keys(errors);

  if (errorFields.length === 1) {
    toastAudit.validation.invalidData(errors[errorFields[0]]);
  } else if (errorFields.length <= 3) {
    errorFields.forEach((field) => {
      toastAudit.validation.invalidData(
        `${getFieldLabel(field)}: ${errors[field]}`,
      );
    });
  } else {
    toastAudit.validation.invalidData(
      `Formulário contém ${errorFields.length} erros. Verifique os campos destacados.`,
    );
  }
};

export const getFieldLabel = (fieldName) => {
  const labels = {
    numero_processo: "Número do Processo",
    titulo: "Título",
    descricao: "Descrição",
    tipo_processo: "Tipo do Processo",
    num_processo_sei: "Número SEI",
    assistido: "Assistido",
    contato_assistido: "Contato do Assistido",
    status: "Status",
    sistema: "Sistema",
    data_encerramento: "Data de Encerramento",
    materia_assunto_id: "Matéria/Assunto",
    fase_id: "Fase",
    diligencia_id: "Diligência",
    local_tramitacao_id: "Local de Tramitação",
    observacoes: "Observações",
    idusuario_responsavel: "Responsável",
  };

  return labels[fieldName] || fieldName;
};

export const validateField = (fieldName, value, formData = {}) => {
  const rule = processValidationRules[fieldName];
  if (!rule) return null;

  if (rule.required && (!value || String(value).trim() === "")) {
    return `${getFieldLabel(fieldName)} é obrigatório`;
  }

  if (!value || String(value).trim() === "") {
    return null;
  }

  const normalizedValue = value == null ? "" : String(value).trim();

  if (rule.minLength && normalizedValue.length < rule.minLength) {
    return `${getFieldLabel(fieldName)} deve ter pelo menos ${rule.minLength} caracteres`;
  }

  if (rule.maxLength && normalizedValue.length > rule.maxLength) {
    return `${getFieldLabel(fieldName)} deve ter no máximo ${rule.maxLength} caracteres`;
  }

  if (rule.pattern && !rule.pattern.test(normalizedValue)) {
    return rule.message;
  }

  if (rule.options && !rule.options.includes(value)) {
    return rule.message;
  }

  if (rule.validate) {
    return rule.validate(value, formData);
  }

  return null;
};

export const applyFieldMask = (fieldName, value) => {
  switch (fieldName) {
    case "numero_processo":
      return value.replace(/[^\d.\-/]/g, "").slice(0, 30);

    case "contato_assistido":
      if (value.includes("@") || /[A-Za-z]/.test(value)) return value;
      {
        const numbers = value.replace(/\D/g, "").slice(0, 11);
        if (!numbers) return "";
        if (numbers.length <= 2) return `(${numbers}`;
        if (numbers.length <= 6) {
          return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
        }
        if (numbers.length <= 10) {
          return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
        }
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
      }

    default:
      return value;
  }
};

export const getInitialProcessFormData = () => ({
  numero_processo: "",
  titulo: "",
  descricao: "",
  status: "Em andamento",
  tipo_processo: "",
  idusuario_responsavel: "",
  data_encerramento: "",
  observacoes: "",
  sistema: "Físico",
  materia_assunto_id: "",
  fase_id: "",
  diligencia_id: "",
  num_processo_sei: "",
  assistido: "",
  contato_assistido: "",
  local_tramitacao_id: "",
});
