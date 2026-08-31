
export function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR");
}

export function formatCurrency(value) {
  if (typeof value !== "number") return "";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
