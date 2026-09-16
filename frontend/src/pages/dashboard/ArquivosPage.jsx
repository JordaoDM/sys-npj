import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { arquivoService } from "../../api/services";
import { useAuthContext } from "../../contexts/AuthContext";
import { toastService } from "../../services/toastService";
import FileUploadForm from "../../components/arquivos/FileUploadForm";
import { getFileUrl } from "../../utils/fileUrl";
import Button from "@/components/common/Button";
import { useArquivoAutoRefresh } from "../../hooks/useAutoRefresh";
import { formatDateTime } from "../../utils/commonUtils";
import { confirmAction } from "../../services/dialogService";

const getNomeArquivo = (arquivo) =>
  typeof arquivo.nome === "object"
    ? arquivo.nome?.nome || JSON.stringify(arquivo.nome)
    : arquivo.nome || "";

const getTipoArquivo = (nome) => {
  const extensao = nome.split(".").pop()?.toLowerCase();
  if (extensao === "pdf") return "PDF";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(extensao))
    return "Imagem";
  if (["doc", "docx"].includes(extensao)) return "Word";
  if (["txt", "rtf", "md"].includes(extensao)) return "Texto";
  return "Outros";
};

const tableCellStyle = {
  padding: "10px 12px",
  border: "1px solid #d7dde3",
  textAlign: "left",
  verticalAlign: "middle",
  backgroundColor: "#fff",
};

const tableHeaderStyle = {
  ...tableCellStyle,
  padding: "11px 12px",
  backgroundColor: "#e9eff7",
  color: "#243b53",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

export default function ArquivosPage() {
  const navigate = useNavigate();
  const { token, user } = useAuthContext();
  const [arquivos, setArquivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [associacao, setAssociacao] = useState("todos");
  const [tipo, setTipo] = useState("todos");
  const [ordenacao, setOrdenacao] = useState("recentes");
  const [agrupamento, setAgrupamento] = useState("nenhum");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [pagina, setPagina] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(20);
  const [totalArquivos, setTotalArquivos] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);

  const { afterUploadArquivo, afterDeleteArquivo, refreshArquivos } =
    useArquivoAutoRefresh(30000);

  const fetchArquivos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await arquivoService.listArquivos(token, {
        page: pagina,
        limit: itensPorPagina,
        busca: buscaAplicada,
        associacao,
        tipo,
        ordenacao,
      });
      setArquivos(data.items || []);
      setTotalArquivos(data.totalItems || 0);
      setTotalPaginas(data.totalPages || 1);
      if (pagina > (data.totalPages || 1)) setPagina(data.totalPages || 1);
    } catch {
      setArquivos([]);
      setTotalArquivos(0);
      setTotalPaginas(1);
    }
    setLoading(false);
  }, [token, pagina, itensPorPagina, buscaAplicada, associacao, tipo, ordenacao]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPagina(1);
      setBuscaAplicada(busca.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [busca]);

  useEffect(() => {
    if (user?.id) fetchArquivos();
  }, [user?.id, fetchArquivos]);

  const handleAfterUpload = () => {
    afterUploadArquivo();
    if (pagina === 1) fetchArquivos();
    else setPagina(1);
  };

  const handleAfterDelete = () => {
    afterDeleteArquivo();
    fetchArquivos();
  };

  const arquivosFiltrados = useMemo(
    () => arquivos.map((arquivo) => {
      const nomeArquivo = getNomeArquivo(arquivo);
      return { ...arquivo, nomeArquivo, tipoArquivo: getTipoArquivo(nomeArquivo) };
    }),
    [arquivos],
  );

  const grupos = useMemo(() => {
    if (agrupamento === "nenhum")
      return [{ chave: "todos", titulo: null, arquivos: arquivosFiltrados }];

    const agrupados = new Map();
    arquivosFiltrados.forEach((arquivo) => {
      let chave;
      let titulo;

      if (agrupamento === "tipo") {
        chave = arquivo.tipoArquivo;
        titulo = arquivo.tipoArquivo;
      } else if (agrupamento === "associacao") {
        chave = arquivo.processo ? "associados" : "nao-associados";
        titulo = arquivo.processo ? "Associados" : "Não associados";
      } else if (arquivo.processo) {
        chave = `processo-${arquivo.processo.id}`;
        titulo = `${arquivo.processo.numero_processo || "Sem número"} — ${arquivo.processo.titulo || "Sem título"}`;
      } else {
        chave = "sem-processo";
        titulo = "Sem processo associado";
      }

      if (!agrupados.has(chave)) agrupados.set(chave, { chave, titulo, arquivos: [] });
      agrupados.get(chave).arquivos.push(arquivo);
    });

    return Array.from(agrupados.values());
  }, [arquivosFiltrados, agrupamento]);

  const filtrosAtivos =
    busca || associacao !== "todos" || tipo !== "todos" ||
    ordenacao !== "recentes" || agrupamento !== "nenhum";

  const limparFiltros = () => {
    setBusca("");
    setAssociacao("todos");
    setTipo("todos");
    setOrdenacao("recentes");
    setAgrupamento("nenhum");
    setPagina(1);
  };

  const renderArquivo = (arquivo) => {
    const nomeCurto =
      arquivo.nomeArquivo.length > 30
        ? arquivo.nomeArquivo.slice(0, 15) + "..." + arquivo.nomeArquivo.slice(-10)
        : arquivo.nomeArquivo;

    return (
      <tr key={arquivo.id}>
        <td style={tableCellStyle} title={arquivo.nomeArquivo}>{nomeCurto}</td>
        <td style={tableCellStyle}>{arquivo.criado_em ? formatDateTime(arquivo.criado_em) : "-"}</td>
        <td style={tableCellStyle}>{arquivo.tamanho ? `${Math.round(arquivo.tamanho / 1024)} KB` : "-"}</td>
        <td style={tableCellStyle}>
          {arquivo.processo ? (
            <Button variant="link" onClick={() => navigate(`/processos/${arquivo.processo.id}`)}>
              {arquivo.processo.numero_processo || "Sem número"} — {arquivo.processo.titulo || "Sem título"}
            </Button>
          ) : (
            "Não associado"
          )}
        </td>
        <td style={tableCellStyle}>
          <Button variant="link" onClick={() => window.open(getFileUrl(arquivo.caminho), "_blank")}>
            Abrir
          </Button>
        </td>
        <td style={tableCellStyle}>
          <Button
            variant="danger"
            onClick={async () => {
              if (
                await confirmAction("Tem certeza que deseja excluir este arquivo?", {
                  title: "Excluir arquivo?",
                  confirmLabel: "Excluir",
                })
              ) {
                try {
                  await arquivoService.deleteArquivo(token, arquivo.id);
                  toastService.fileDeleted(arquivo.nomeArquivo || "Arquivo");
                  setArquivos((atuais) => atuais.filter((item) => item.id !== arquivo.id));
                  handleAfterDelete();
                } catch (err) {
                  toastService.error(`Erro ao excluir arquivo: ${err.message || "Erro inesperado"}`);
                }
              }
            }}
          >
            Excluir
          </Button>
        </td>
      </tr>
    );
  };

  return (
    <>
      <div style={{ marginBottom: "20px" }}>
        <h1
          style={{
            margin: 0,
            fontSize: "24px",
            fontWeight: "600",
            color: "#343a40",
          }}
        >
          Meus Arquivos
        </h1>
        <p
          style={{
            margin: "8px 0 0 0",
            fontSize: "14px",
            color: "#6c757d",
          }}
        >
          Gerencie seus arquivos e documentos
        </p>
      </div>

      <FileUploadForm onUpload={handleAfterUpload} />
      <section
        aria-label="Filtros de arquivos"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          alignItems: "flex-start",
          margin: "20px 0 12px",
          padding: "16px",
          border: "1px solid #dee2e6",
          borderRadius: "8px",
          backgroundColor: "#fff",
        }}
      >
        <label style={{ flex: "2 1 240px" }}>
          <span style={{ display: "block", marginBottom: "4px", fontSize: "13px" }}>Buscar por nome</span>
          <input
            type="search"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Digite o nome do arquivo"
            style={{ width: "100%", padding: "8px", border: "1px solid #ced4da", borderRadius: "4px" }}
          />
        </label>
        <label style={{ flex: "1 1 160px" }}>
          <span style={{ display: "block", marginBottom: "4px", fontSize: "13px" }}>Associação</span>
          <select value={associacao} onChange={(event) => { setAssociacao(event.target.value); setPagina(1); }} style={{ width: "100%", padding: "8px" }}>
            <option value="todos">Todos</option>
            <option value="associados">Associados</option>
            <option value="nao_associados">Não associados</option>
          </select>
        </label>
        <label style={{ flex: "1 1 140px" }}>
          <span style={{ display: "block", marginBottom: "4px", fontSize: "13px" }}>Tipo</span>
          <select value={tipo} onChange={(event) => { setTipo(event.target.value); setPagina(1); }} style={{ width: "100%", padding: "8px" }}>
            <option value="todos">Todos</option>
            <option value="PDF">PDF</option>
            <option value="Imagem">Imagem</option>
            <option value="Word">Word</option>
            <option value="Texto">Texto</option>
            <option value="Outros">Outros</option>
          </select>
        </label>
        <label style={{ flex: "1 1 160px" }}>
          <span style={{ display: "block", marginBottom: "4px", fontSize: "13px" }}>Ordenar por</span>
          <select value={ordenacao} onChange={(event) => { setOrdenacao(event.target.value); setPagina(1); }} style={{ width: "100%", padding: "8px" }}>
            <option value="recentes">Mais recentes</option>
            <option value="antigos">Mais antigos</option>
            <option value="nome_az">Nome A–Z</option>
            <option value="nome_za">Nome Z–A</option>
            <option value="processo">Processo associado</option>
          </select>
        </label>
        <label style={{ flex: "1 1 160px" }}>
          <span style={{ display: "block", marginBottom: "4px", fontSize: "13px" }}>Agrupar por</span>
          <select value={agrupamento} onChange={(event) => setAgrupamento(event.target.value)} style={{ width: "100%", padding: "8px" }}>
            <option value="nenhum">Sem agrupamento</option>
            <option value="tipo">Tipo</option>
            <option value="associacao">Associação</option>
            <option value="processo">Processo</option>
          </select>
        </label>
        {filtrosAtivos && (
          <div style={{ flex: "0 0 auto" }}>
            <span
              aria-hidden="true"
              style={{ display: "block", marginBottom: "4px", fontSize: "13px", visibility: "hidden" }}
            >
              Ações
            </span>
            <Button
              variant="outline"
              onClick={limparFiltros}
              style={{ height: "41px", minHeight: "41px", margin: 0 }}
            >
              Limpar filtros
            </Button>
          </div>
        )}
      </section>
      {loading ? (
        <div>Carregando arquivos...</div>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
              margin: "0 0 10px",
              color: "#6c757d",
              fontSize: "14px",
            }}
          >
            <span>
              {totalArquivos === 0
                ? "Nenhum arquivo encontrado"
                : `Exibindo ${(pagina - 1) * itensPorPagina + 1}–${Math.min(pagina * itensPorPagina, totalArquivos)} de ${totalArquivos} ${totalArquivos === 1 ? "arquivo" : "arquivos"}`}
            </span>
            <label>
              Itens por página:{" "}
              <select
                value={itensPorPagina}
                onChange={(event) => {
                  setItensPorPagina(Number(event.target.value));
                  setPagina(1);
                }}
                style={{ padding: "5px" }}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </label>
          </div>
          {arquivosFiltrados.length === 0 ? (
            <div>Nenhum arquivo corresponde aos filtros selecionados.</div>
          ) : (
            <div style={{ overflowX: "auto", borderRadius: "6px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #d7dde3" }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>Nome</th>
                    <th style={tableHeaderStyle}>Data</th>
                    <th style={tableHeaderStyle}>Tamanho</th>
                    <th style={tableHeaderStyle}>Processo associado</th>
                    <th style={tableHeaderStyle}>Abrir</th>
                    <th style={tableHeaderStyle}>Excluir</th>
                  </tr>
                </thead>
                {grupos.map((grupo) => (
                  <tbody key={grupo.chave}>
                    {grupo.titulo && (
                      <tr>
                        <th
                          colSpan="6"
                          style={{
                            ...tableCellStyle,
                            backgroundColor: "#f5f7fa",
                            color: "#334e68",
                            fontWeight: 600,
                          }}
                        >
                          {grupo.titulo} — {grupo.arquivos.length} {grupo.arquivos.length === 1 ? "arquivo" : "arquivos"}
                        </th>
                      </tr>
                    )}
                    {grupo.arquivos.map(renderArquivo)}
                  </tbody>
                ))}
              </table>
            </div>
          )}
          {agrupamento !== "nenhum" && arquivosFiltrados.length > 0 && (
            <p style={{ color: "#6c757d", fontSize: "12px", marginTop: "8px" }}>
              Agrupamento aplicado aos arquivos desta página.
            </p>
          )}
          {totalPaginas > 1 && (
            <nav
              aria-label="Paginação de arquivos"
              style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginTop: "16px" }}
            >
              <Button variant="outline" disabled={pagina === 1} onClick={() => setPagina((atual) => Math.max(atual - 1, 1))}>
                Anterior
              </Button>
              <span>Página {pagina} de {totalPaginas}</span>
              <Button variant="outline" disabled={pagina === totalPaginas} onClick={() => setPagina((atual) => Math.min(atual + 1, totalPaginas))}>
                Próxima
              </Button>
            </nav>
          )}
        </>
      )}
    </>
  );
}
