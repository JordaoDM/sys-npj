export function getFileUrl(caminho) {
  if (!caminho) return "";
  let clean = caminho
    .replace(/^.*uploads[\\/]/, "uploads/")
    .replace(/^\\+|^\/+/, "");
  const baseUrl =
    import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:3001";
  return `${baseUrl}/${clean}`;
}
