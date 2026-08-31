import React, { useState, useEffect } from "react";
import { useAuthContext } from "../../contexts/AuthContext";
import { apiRequest } from "../../api/apiRequest";
import { getFileUrl } from "../../utils/fileUrl";
import { confirmAction } from "../../services/dialogService";

const getRoleName = (role) => {
  if (!role) return "Usuário";
  if (typeof role === "string") return role;
  if (typeof role === "object" && role.nome) return role.nome;
  if (typeof role === "object" && role.name) return role.name;
  return "Usuário";
};

export default function ProfileView() {
  const { user, token, setUser } = useAuthContext();
  const [perfil, setPerfil] = useState(null);
  const [form, setForm] = useState({ nome: "", email: "", telefone: "" });
  const [edit, setEdit] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [arquivos, setArquivos] = useState([]);
  const [loadingArquivos, setLoadingArquivos] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [senhaMsg, setSenhaMsg] = useState("");
  const [inativando, setInativando] = useState(false);
  const [inativarMsg, setInativarMsg] = useState("");

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setSenhaMsg("");
    try {
      if (!senhaAtual) {
        setSenhaMsg("Informe sua senha atual.");
        return;
      }
      if (!novaSenha || novaSenha.length < 6) {
        setSenhaMsg("A nova senha deve ter pelo menos 6 caracteres.");
        return;
      }
      await apiRequest(`/api/usuarios/me/senha`, {
        method: "PUT",
        token,
        body: { senha_atual: senhaAtual, nova_senha: novaSenha },
      });
      setSenhaMsg("Senha atualizada com sucesso!");
      setSenhaAtual("");
      setNovaSenha("");
    } catch (err) {
      setSenhaMsg(err.message || "Erro ao alterar senha");
    }
  };

  const handleInativarConta = async () => {
    if (
      !(await confirmAction(
        "Tem certeza que deseja inativar sua conta? Essa ação é irreversível!",
        { title: "Inativar conta?", confirmLabel: "Inativar" },
      ))
    )
      return;
    setInativando(true);
    setInativarMsg("");
    try {
      await apiRequest(`/api/usuarios/me`, {
        method: "DELETE",
        token,
      });
      setInativarMsg("Conta inativada. Você será deslogado.");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err) {
      setInativarMsg(err.message || "Erro ao inativar conta");
    }
    setInativando(false);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const perfilResponse = await apiRequest("/api/usuarios/me", { token });
        const perfilData = perfilResponse.data;
        setPerfil(perfilData);
        setUser(perfilData);
        setForm({
          nome: perfilData.nome,
          email: perfilData.email,
          telefone: perfilData.telefone || "",
        });
      } catch (err) {
        setMsg("Erro ao carregar perfil: " + (err.message || ""));
      }
      setLoading(false);
    };
    fetchProfile();
    // eslint-disable-next-line
  }, [token, setUser]);

  useEffect(() => {
    const fetchArquivos = async () => {
      if (!perfil?.id || !token) return;
      setLoadingArquivos(true);
      try {
        const response = await apiRequest(`/api/arquivos/usuario/${perfil.id}`, {
          token,
        });
        setArquivos(Array.isArray(response.data) ? response.data : []);
      } catch {
        setArquivos([]);
      }
      setLoadingArquivos(false);
    };
    fetchArquivos();
  }, [perfil?.id, token]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const truncateFileName = (fileName, maxLength = 30) => {
    if (fileName.length <= maxLength) return fileName;
    const extension = fileName.split(".").pop();
    const nameWithoutExt = fileName.slice(0, fileName.lastIndexOf("."));
    const truncatedName =
      nameWithoutExt.slice(0, maxLength - extension.length - 4) + "...";
    return `${truncatedName}.${extension}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      await apiRequest(`/api/usuarios/me`, {
        method: "PUT",
        body: { nome: form.nome, email: form.email, telefone: form.telefone },
        token,
      });
      setPerfil({ ...perfil, ...form });
      setUser({ ...perfil, ...form });
      setEdit(false);
      setMsg("Perfil atualizado!");
    } catch (err) {
      setMsg(err.message || "Erro ao atualizar perfil");
    }
  };

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "200px",
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ textAlign: "center", color: "#666" }}>
          <div style={{ fontSize: "2rem", marginBottom: "10px" }}></div>
          <div>Carregando perfil...</div>
        </div>
      </div>
    );

  if (!perfil)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "200px",
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ textAlign: "center", color: "#dc3545" }}>
          <div style={{ fontSize: "2rem", marginBottom: "10px" }}></div>
          <div>Não foi possível carregar o perfil.</div>
        </div>
      </div>
    );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: "20px",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "30px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
          border: "3px solid #007bff20",
        }}
      >
        <h3
          style={{
            color: "#007bff",
            marginBottom: "20px",
            fontSize: "1.3rem",
            fontWeight: "bold",
            borderBottom: "2px solid #007bff20",
            paddingBottom: "10px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          Informações Pessoais
        </h3>

        {msg && (
          <div
            style={{
              backgroundColor: msg.includes("Erro") ? "#fee" : "#efe",
              border: `1px solid ${msg.includes("Erro") ? "#fcc" : "#cfc"}`,
              color: msg.includes("Erro") ? "#c33" : "#363",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontSize: "0.9rem",
              textAlign: "center",
            }}
          >
            {msg.includes("Erro") ? "" : ""} {msg}
          </div>
        )}

        {!edit ? (
          <div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "20px",
                marginBottom: "25px",
              }}
            >
              <div
                style={{
                  padding: "15px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "8px",
                  borderLeft: "4px solid #007bff",
                }}
              >
                <div
                  style={{
                    fontSize: "0.9rem",
                    color: "#666",
                    marginBottom: "5px",
                  }}
                >
                  {" "}
                  Nome
                </div>
                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    color: "#333",
                  }}
                >
                  {perfil.nome}
                </div>
              </div>

              <div
                style={{
                  padding: "15px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "8px",
                  borderLeft: "4px solid #28a745",
                }}
              >
                <div
                  style={{
                    fontSize: "0.9rem",
                    color: "#666",
                    marginBottom: "5px",
                  }}
                >
                  {" "}
                  Email
                </div>
                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    color: "#333",
                  }}
                >
                  {perfil.email}
                </div>
              </div>

              <div
                style={{
                  padding: "15px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "8px",
                  borderLeft: "4px solid #ffc107",
                }}
              >
                <div
                  style={{
                    fontSize: "0.9rem",
                    color: "#666",
                    marginBottom: "5px",
                  }}
                >
                  {" "}
                  Telefone
                </div>
                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    color: "#333",
                  }}
                >
                  {perfil.telefone || "Não informado"}
                </div>
              </div>

              <div
                style={{
                  padding: "15px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "8px",
                  borderLeft: "4px solid #6f42c1",
                }}
              >
                <div
                  style={{
                    fontSize: "0.9rem",
                    color: "#666",
                    marginBottom: "5px",
                  }}
                >
                  {" "}
                  Tipo
                </div>
                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    color: "#333",
                  }}
                >
                  {getRoleName(perfil.role)}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                onClick={() => setEdit(true)}
                style={{
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  padding: "12px 20px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor = "#0056b3")
                }
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor = "#007bff")
                }
              >
                Editar Dados
              </button>

              <button
                onClick={() => setShowPasswordForm((v) => !v)}
                style={{
                  backgroundColor: "#ffc107",
                  color: "#212529",
                  border: "none",
                  padding: "12px 20px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor = "#e0a800")
                }
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor = "#ffc107")
                }
              >
                Trocar Senha
              </button>

              <button
                onClick={handleInativarConta}
                disabled={inativando}
                style={{
                  backgroundColor: inativando ? "#ccc" : "#dc3545",
                  color: "white",
                  border: "none",
                  padding: "12px 20px",
                  borderRadius: "8px",
                  cursor: inativando ? "not-allowed" : "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  if (!inativando) e.target.style.backgroundColor = "#c82333";
                }}
                onMouseLeave={(e) => {
                  if (!inativando) e.target.style.backgroundColor = "#dc3545";
                }}
              >
                {inativando ? " Processando..." : " Inativar Conta"}
              </button>
            </div>

            {inativarMsg && (
              <div
                style={{
                  marginTop: "15px",
                  padding: "12px",
                  backgroundColor: "#fee",
                  border: "1px solid #fcc",
                  color: "#c33",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  textAlign: "center",
                }}
              >
                {inativarMsg}
              </div>
            )}
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{ display: "grid", gap: "20px" }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                  color: "#333",
                  marginBottom: "8px",
                }}
              >
                Nome:
              </label>
              <input
                name="nome"
                value={form.nome}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "2px solid #e9ecef",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  transition: "border-color 0.3s ease",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#007bff")}
                onBlur={(e) => (e.target.style.borderColor = "#e9ecef")}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                  color: "#333",
                  marginBottom: "8px",
                }}
              >
                Email:
              </label>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "2px solid #e9ecef",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  transition: "border-color 0.3s ease",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#007bff")}
                onBlur={(e) => (e.target.style.borderColor = "#e9ecef")}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                  color: "#333",
                  marginBottom: "8px",
                }}
              >
                Telefone:
              </label>
              <input
                name="telefone"
                value={form.telefone}
                onChange={handleChange}
                placeholder="Ex: (11) 99999-9999"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "2px solid #e9ecef",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  transition: "border-color 0.3s ease",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#007bff")}
                onBlur={(e) => (e.target.style.borderColor = "#e9ecef")}
              />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="submit"
                style={{
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  padding: "12px 20px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor = "#218838")
                }
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor = "#28a745")
                }
              >
                Salvar Alterações
              </button>

              <button
                type="button"
                onClick={() => setEdit(false)}
                style={{
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  padding: "12px 20px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor = "#5a6268")
                }
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor = "#6c757d")
                }
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      {showPasswordForm && (
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "30px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
            border: "3px solid #ffc10720",
          }}
        >
          <h3
            style={{
              color: "#ffc107",
              marginBottom: "20px",
              fontSize: "1.3rem",
              fontWeight: "bold",
              borderBottom: "2px solid #ffc10720",
              paddingBottom: "10px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            Alterar Senha
          </h3>

          <form
            onSubmit={handlePasswordChange}
            style={{ display: "grid", gap: "20px" }}
          >
            <div>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "bold", color: "#333", marginBottom: "8px" }}>
                Senha atual:
              </label>
              <input
                type="password"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                required
                autoComplete="current-password"
                style={{ width: "100%", padding: "12px 16px", border: "2px solid #e9ecef", borderRadius: "8px", fontSize: "1rem", boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                  color: "#333",
                  marginBottom: "8px",
                }}
              >
                Nova Senha:
              </label>
              <input
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "2px solid #e9ecef",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  transition: "border-color 0.3s ease",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#ffc107")}
                onBlur={(e) => (e.target.style.borderColor = "#e9ecef")}
              />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="submit"
                style={{
                  backgroundColor: "#ffc107",
                  color: "#212529",
                  border: "none",
                  padding: "12px 20px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor = "#e0a800")
                }
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor = "#ffc107")
                }
              >
                Salvar Nova Senha
              </button>

              <button
                type="button"
                onClick={() => setShowPasswordForm(false)}
                style={{
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  padding: "12px 20px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor = "#5a6268")
                }
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor = "#6c757d")
                }
              >
                Cancelar
              </button>
            </div>

            {senhaMsg && (
              <div
                style={{
                  padding: "12px",
                  backgroundColor: senhaMsg.includes("sucesso")
                    ? "#efe"
                    : "#fee",
                  border: `1px solid ${senhaMsg.includes("sucesso") ? "#cfc" : "#fcc"}`,
                  color: senhaMsg.includes("sucesso") ? "#363" : "#c33",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  textAlign: "center",
                }}
              >
                {senhaMsg.includes("sucesso") ? "" : ""} {senhaMsg}
              </div>
            )}
          </form>
        </div>
      )}

      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "30px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
          border: "3px solid #17a2b820",
        }}
      >
        <h3
          style={{
            color: "#17a2b8",
            marginBottom: "20px",
            fontSize: "1.3rem",
            fontWeight: "bold",
            borderBottom: "2px solid #17a2b820",
            paddingBottom: "10px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          Meus Arquivos Enviados
        </h3>

        {loadingArquivos ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100px",
              color: "#666",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2rem", marginBottom: "10px" }}></div>
              <div>Carregando arquivos...</div>
            </div>
          </div>
        ) : arquivos.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "#666",
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
              border: "2px dashed #dee2e6",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "15px" }}></div>
            <div
              style={{
                fontSize: "1.1rem",
                fontWeight: "bold",
                marginBottom: "5px",
              }}
            >
              Nenhum arquivo enviado
            </div>
            <div style={{ fontSize: "0.9rem" }}>
              Seus arquivos aparecerão aqui quando forem enviados ao sistema.
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "15px",
            }}
          >
            {arquivos.map((arquivo) => (
              <div
                key={arquivo.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "15px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "8px",
                  border: "1px solid #e9ecef",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#e9ecef";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#f8f9fa";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "15px",
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      fontSize: "1.5rem",
                    }}
                  ></div>
                  <div>
                    <div
                      style={{
                        fontWeight: "bold",
                        color: "#333",
                        marginBottom: "5px",
                      }}
                      title={arquivo.nome}
                    >
                      {truncateFileName(arquivo.nome)}
                    </div>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "#666",
                      }}
                    >
                      Tamanho: {Math.round(arquivo.tamanho / 1024)} KB
                    </div>
                  </div>
                </div>

                <button
                  onClick={() =>
                    window.open(
                      getFileUrl(arquivo.caminho),
                      "_blank",
                      "noopener,noreferrer",
                    )
                  }
                  style={{
                    backgroundColor: "#17a2b8",
                    color: "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.target.style.backgroundColor = "#138496")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.backgroundColor = "#17a2b8")
                  }
                >
                  Abrir
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
