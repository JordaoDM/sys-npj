import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";

const features = [
  {
    icon: "",
    title: "Gestão de Processos",
    description:
      "Controle completo de todos os processos jurídicos em andamento.",
  },
  {
    icon: "",
    title: "Documentação Digital",
    description:
      "Armazene e acesse todos os documentos relacionados aos processos.",
  },
  {
    icon: "",
    title: "Gestão de Usuários",
    description:
      "Cadastro e acompanhamento de alunos, professores e administradores.",
  },
  {
    icon: "",
    title: "Controle de Prazos",
    description: "Acompanhe atualizações e histórico dos processos.",
  },
];

const FeatureCard = ({ icon, title, description }) => (
  <div
    style={{
      backgroundColor: "white",
      borderRadius: "8px",
      padding: "30px 20px",
      textAlign: "center",
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
      borderTop: "4px solid #007bff",
      transition: "transform 0.3s ease, box-shadow 0.3s ease",
      cursor: "pointer",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-10px)";
      e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.15)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
    }}
  >
    <div
      style={{
        fontSize: "3rem",
        marginBottom: "20px",
      }}
    >
      {icon}
    </div>
    <h3
      style={{
        color: "#001F3F",
        marginBottom: "15px",
        fontSize: "1.25rem",
        fontWeight: "bold",
      }}
    >
      {title}
    </h3>
    <p
      style={{
        color: "#666",
        lineHeight: "1.6",
        margin: 0,
      }}
    >
      {description}
    </p>
  </div>
);

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const handleLoginClick = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      <header
        style={{
          backgroundColor: "#001F3F",
          padding: "20px 0",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <div
              style={{
                width: "50px",
                height: "50px",
                backgroundColor: "white",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: "#001F3F",
              }}
            >
              NPJ
            </div>
            <h1
              style={{
                color: "white",
                margin: 0,
                fontSize: "1.5rem",
                fontWeight: "bold",
              }}
            >
              Sistema NPJ - UFMT
            </h1>
          </div>
          <button
            onClick={handleLoginClick}
            style={{
              backgroundColor: "transparent",
              border: "2px solid white",
              color: "white",
              padding: "10px 20px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "bold",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "white";
              e.target.style.color = "#001F3F";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "transparent";
              e.target.style.color = "white";
            }}
          >
            {user ? "Ir para Dashboard" : "Área Restrita"}
          </button>
        </div>
      </header>

      <section
        style={{
          background: "linear-gradient(135deg, #001F3F 0%, #003366 100%)",
          color: "white",
          padding: "80px 0",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 20px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "60px",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                backgroundColor: "#007bff",
                color: "white",
                padding: "8px 16px",
                borderRadius: "20px",
                display: "inline-block",
                fontSize: "0.9rem",
                fontWeight: "bold",
                marginBottom: "20px",
              }}
            >
              Núcleo de Práticas Jurídicas
            </div>
            <h2
              style={{
                fontSize: "3rem",
                lineHeight: "1.2",
                marginBottom: "20px",
                fontWeight: "bold",
              }}
            >
              Gestão Inteligente de Processos Jurídicos
            </h2>
            <p
              style={{
                fontSize: "1.25rem",
                marginBottom: "30px",
                lineHeight: "1.6",
                opacity: 0.9,
              }}
            >
              Plataforma completa para gestão de processos, usuários e
              documentos do NPJ da Universidade Federal de Mato Grosso.
            </p>
            <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
              <button
                onClick={handleLoginClick}
                style={{
                  backgroundColor: "rgba(255,255,255,0.9)",
                  color: "#001F3F",
                  border: "none",
                  padding: "15px 30px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "1.1rem",
                  fontWeight: "bold",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "white";
                  e.target.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "rgba(255,255,255,0.9)";
                  e.target.style.transform = "translateY(0)";
                }}
              >
                {user ? "Acessar Dashboard" : "Acessar o Sistema"}
              </button>
              <button
                onClick={() => window.open("https://ufmt.br", "_blank")}
                style={{
                  backgroundColor: "transparent",
                  color: "white",
                  border: "2px solid white",
                  padding: "15px 30px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "1.1rem",
                  fontWeight: "bold",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "white";
                  e.target.style.color = "#001F3F";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent";
                  e.target.style.color = "white";
                }}
              >
                Saiba Mais
              </button>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: "20px",
                padding: "40px",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.2)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "8rem",
                  marginBottom: "20px",
                }}
              ></div>
              <h3
                style={{
                  fontSize: "1.5rem",
                  margin: 0,
                  opacity: 0.9,
                }}
              >
                Sistema de Gestão Jurídica
              </h3>
            </div>
          </div>
        </div>
      </section>

      <section
        style={{
          padding: "80px 0",
          backgroundColor: "#f8f9fa",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 20px",
          }}
        >
          <h2
            style={{
              textAlign: "center",
              fontSize: "2.5rem",
              marginBottom: "60px",
              color: "#001F3F",
              fontWeight: "bold",
            }}
          >
            Funcionalidades do Sistema
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "30px",
            }}
          >
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </div>
      </section>

      <section
        style={{
          padding: "80px 0",
          backgroundColor: "white",
          borderTop: "1px solid #e9ecef",
          borderBottom: "1px solid #e9ecef",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 20px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "60px",
            alignItems: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "#f8f9fa",
              borderRadius: "12px",
              padding: "40px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "6rem",
                marginBottom: "20px",
              }}
            ></div>
            <h3
              style={{
                fontSize: "1.5rem",
                color: "#001F3F",
                margin: 0,
              }}
            >
              UFMT Campus
            </h3>
          </div>
          <div>
            <h2
              style={{
                fontSize: "2rem",
                marginBottom: "20px",
                color: "#001F3F",
                fontWeight: "bold",
              }}
            >
              Sobre o NPJ da UFMT
            </h2>
            <p
              style={{
                fontSize: "1.1rem",
                marginBottom: "20px",
                lineHeight: "1.6",
                color: "#555",
              }}
            >
              O Núcleo de Práticas Jurídicas da Universidade Federal de Mato
              Grosso é um espaço de aprendizado prático para estudantes de
              Direito, oferecendo assistência jurídica gratuita à comunidade.
            </p>
            <p
              style={{
                fontSize: "1.1rem",
                marginBottom: "30px",
                lineHeight: "1.6",
                color: "#555",
              }}
            >
              Este sistema foi desenvolvido para otimizar a gestão de processos,
              permitindo que estudantes e professores acompanhem casos, prazos e
              documentos de forma eficiente e segura.
            </p>
            <button
              onClick={() => window.open("https://ufmt.br", "_blank")}
              style={{
                backgroundColor: "transparent",
                color: "#007bff",
                border: "2px solid #007bff",
                padding: "12px 24px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: "bold",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#007bff";
                e.target.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "transparent";
                e.target.style.color = "#007bff";
              }}
            >
              Conheça o NPJ
            </button>
          </div>
        </div>
      </section>

      <footer
        style={{
          backgroundColor: "#001F3F",
          color: "white",
          padding: "50px 0 30px",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 20px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "40px",
              marginBottom: "40px",
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: "1.25rem",
                  marginBottom: "20px",
                  fontWeight: "bold",
                }}
              >
                Sistema NPJ
              </h3>
              <p
                style={{
                  lineHeight: "1.6",
                  opacity: 0.8,
                }}
              >
                Plataforma de gestão de processos do Núcleo de Práticas
                Jurídicas da Universidade Federal de Mato Grosso.
              </p>
            </div>
            <div>
              <h3
                style={{
                  fontSize: "1.25rem",
                  marginBottom: "20px",
                  fontWeight: "bold",
                }}
              >
                Links Úteis
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <button
                  onClick={handleLoginClick}
                  style={{
                    background: "none",
                    border: "none",
                    color: "white",
                    cursor: "pointer",
                    padding: "5px 0",
                    textAlign: "left",
                    fontSize: "1rem",
                    opacity: 0.8,
                    transition: "opacity 0.3s ease",
                  }}
                  onMouseEnter={(e) => (e.target.style.opacity = "1")}
                  onMouseLeave={(e) => (e.target.style.opacity = "0.8")}
                >
                  Acesso ao Sistema
                </button>
                <button
                  onClick={() => navigate("/processos")}
                  disabled={!user}
                  style={{
                    background: "none",
                    border: "none",
                    color: user ? "white" : "#666",
                    cursor: user ? "pointer" : "not-allowed",
                    padding: "5px 0",
                    textAlign: "left",
                    fontSize: "1rem",
                    opacity: user ? 0.8 : 0.4,
                    transition: "opacity 0.3s ease",
                  }}
                  onMouseEnter={(e) => user && (e.target.style.opacity = "1")}
                  onMouseLeave={(e) => user && (e.target.style.opacity = "0.8")}
                >
                  Gerenciar Processos
                </button>
                <button
                  onClick={() => navigate("/usuarios")}
                  disabled={!user}
                  style={{
                    background: "none",
                    border: "none",
                    color: user ? "white" : "#666",
                    cursor: user ? "pointer" : "not-allowed",
                    padding: "5px 0",
                    textAlign: "left",
                    fontSize: "1rem",
                    opacity: user ? 0.8 : 0.4,
                    transition: "opacity 0.3s ease",
                  }}
                  onMouseEnter={(e) => user && (e.target.style.opacity = "1")}
                  onMouseLeave={(e) => user && (e.target.style.opacity = "0.8")}
                >
                  Gerenciar Usuários
                </button>
              </div>
            </div>
            <div>
              <h3
                style={{
                  fontSize: "1.25rem",
                  marginBottom: "20px",
                  fontWeight: "bold",
                }}
              >
                Contato
              </h3>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <p style={{ margin: 0, opacity: 0.8 }}>
                  {" "}
                  Av. Fernando Corrêa da Costa, 2367
                </p>
                <p style={{ margin: 0, opacity: 0.8, marginLeft: "20px" }}>
                  Boa Esperança, Cuiabá - MT
                </p>
                <p style={{ margin: 0, opacity: 0.8, marginLeft: "20px" }}>
                  CEP: 78060-900
                </p>
                <p style={{ margin: 0, opacity: 0.8 }}> npj@ufmt.br</p>
                <p style={{ margin: 0, opacity: 0.8 }}> (65) 3615-8000</p>
              </div>
            </div>
            <div>
              <h3
                style={{
                  fontSize: "1.25rem",
                  marginBottom: "20px",
                  fontWeight: "bold",
                }}
              >
                Legal
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <a
                  href="#"
                  style={{
                    color: "white",
                    textDecoration: "none",
                    opacity: 0.8,
                    transition: "opacity 0.3s ease",
                  }}
                  onMouseEnter={(e) => (e.target.style.opacity = "1")}
                  onMouseLeave={(e) => (e.target.style.opacity = "0.8")}
                >
                  Termos de Uso
                </a>
                <a
                  href="#"
                  style={{
                    color: "white",
                    textDecoration: "none",
                    opacity: 0.8,
                    transition: "opacity 0.3s ease",
                  }}
                  onMouseEnter={(e) => (e.target.style.opacity = "1")}
                  onMouseLeave={(e) => (e.target.style.opacity = "0.8")}
                >
                  Política de Privacidade
                </a>
                <a
                  href="#"
                  style={{
                    color: "white",
                    textDecoration: "none",
                    opacity: 0.8,
                    transition: "opacity 0.3s ease",
                  }}
                  onMouseEnter={(e) => (e.target.style.opacity = "1")}
                  onMouseLeave={(e) => (e.target.style.opacity = "0.8")}
                >
                  Acessibilidade
                </a>
              </div>
            </div>
          </div>

          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.1)",
              paddingTop: "20px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                margin: 0,
                opacity: 0.6,
                fontSize: "0.9rem",
              }}
            >
              {new Date().getFullYear()} Universidade Federal de Mato Grosso -
              NPJ. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
