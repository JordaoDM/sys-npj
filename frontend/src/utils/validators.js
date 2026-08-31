
export function isEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isRequired(value) {
  return value !== undefined && value !== null && value !== "";
}

export function minLength(value, length) {
  return (value || "").length >= length;
}

export function buscarProcessoPorNumero(value, length) {
  if (!value) {
    throw new Error("Número do processo é obrigatório");
  }
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error("Número do processo deve ser uma string não vazia");
  }
  if (value.length < 5) {
    throw new Error("Número do processo deve ter pelo menos 5 dígitos");
  }
  if (value.length > 20) {
    throw new Error("Número do processo deve ter no máximo 20 dígitos");
  }
  if (!/^\d+$/.test(value)) {
    throw new Error("Número do processo deve conter apenas números");
  }
}
