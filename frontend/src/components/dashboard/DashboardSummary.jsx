import React from "react";
import useApi from "../../hooks/useApi.jsx";
import { getStatusLabel } from "../../utils/commonUtils";
const { getUserRole } = useApi();

const renderSafeValue = (value, fallback = "N/A") => {
  if (!value) return fallback;
  if (typeof value === "object" && value.nome) return value.nome;
  if (typeof value === "object" && value.name) return value.name;
  if (typeof value === "object") return JSON.stringify(value);
  return value;
};

function StatItem({ label, value, color = "#333", icon = "" }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 24, fontWeight: "bold", color }}>
        {icon && <span style={{ marginRight: 8 }}>{icon}</span>}
        {value}
      </div>
      <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>{label}</div>
    </div>
  );
}

function StatusProgressBar({ label, value, total, color = "#007bff" }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <div style={{ marginBottom: 8 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 13,
          marginBottom: 4,
        }}
      >
        <span>{label}</span>
        <span style={{ fontWeight: "bold" }}>{value}</span>
      </div>
      <div
        style={{
          backgroundColor: "#e9ecef",
          borderRadius: 12,
          height: 8,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            backgroundColor: color,
            height: "100%",
            width: `${percentage}%`,
            transition: "width 0.5s ease",
            borderRadius: 12,
          }}
        ></div>
      </div>
      {total > 0 && (
        <div
          style={{
            fontSize: 10,
            color: "#666",
            marginTop: 2,
            textAlign: "right",
          }}
        >
          {percentage.toFixed(1)}%
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const getStatusColor = (statusValue) => {
    switch (getStatusLabel(statusValue)) {
      case "Em andamento":
        return "#ffc107";
      case "Aguardando":
        return "#fd7e14";
      case "Finalizado":
        return "#28a745";
      case "Arquivado":
        return "#6c757d";
      default:
        return "#007bff";
    }
  };

  return (
    <span
      style={{
        backgroundColor: getStatusColor(status),
        color: "white",
        padding: "4px 8px",
        borderRadius: 12,
        fontSize: 11,
        fontWeight: "bold",
        textTransform: "uppercase",
      }}
    >
      {getStatusLabel(status)}
    </span>
  );
}

function Card({ title, children, color = "#007bff" }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      style={{
        backgroundColor: "white",
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        boxShadow: hover
          ? "0 4px 20px rgba(0,0,0,0.12)"
          : "0 2px 10px rgba(0,0,0,0.08)",
        border: `3px solid ${color}20`,
        transform: hover ? "translateY(-2px)" : "translateY(0)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {title && (
        <h3
          style={{
            color: color,
            marginBottom: 16,
            fontSize: 16,
            fontWeight: "bold",
            borderBottom: `2px solid ${color}20`,
            paddingBottom: 8,
          }}
        >
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

function PieChart({ data, title }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 20, color: "#666" }}>
        <p>Sem dados para exibir</p>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;

  const colors = [
    "#007bff",
    "#28a745",
    "#ffc107",
    "#dc3545",
    "#6c757d",
    "#17a2b8",
  ];

  return (
    <div style={{ textAlign: "center" }}>
      {title && <h4 style={{ marginBottom: 16, color: "#333" }}>{title}</h4>}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ position: "relative" }}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="#e9ecef"
              strokeWidth="12"
            />
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const angle = (item.value / total) * 360;
              const largeArcFlag = angle > 180 ? 1 : 0;

              const startX =
                60 + 54 * Math.cos(((currentAngle - 90) * Math.PI) / 180);
              const startY =
                60 + 54 * Math.sin(((currentAngle - 90) * Math.PI) / 180);

              currentAngle += angle;

              const endX =
                60 + 54 * Math.cos(((currentAngle - 90) * Math.PI) / 180);
              const endY =
                60 + 54 * Math.sin(((currentAngle - 90) * Math.PI) / 180);

              if (item.value === 0) return null;

              return (
                <path
                  key={index}
                  d={`M 60 60 L ${startX} ${startY} A 54 54 0 ${largeArcFlag} 1 ${endX} ${endY} Z`}
                  fill={colors[index % colors.length]}
                  opacity="0.8"
                />
              );
            })}
          </svg>
        </div>

        <div style={{ flex: 1, marginLeft: 20 }}>
          {data.map((item, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 8,
                fontSize: 12,
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  backgroundColor: colors[index % colors.length],
                  borderRadius: "50%",
                  marginRight: 8,
                  opacity: 0.8,
                }}
              ></div>
              <span style={{ flex: 1 }}>{item.label}</span>
              <span style={{ fontWeight: "bold", marginLeft: 8 }}>
                {item.value} (
                {total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AlunosDashboard({ dashboardData, user }) {
  const meusProcessos = Array.isArray(dashboardData?.processos) ? dashboardData.processos : [];
  const processosAtivos = meusProcessos.filter(
    (p) => p.status !== "arquivado",
  ).length;
  const processosFinalizados = meusProcessos.filter(
    (p) => p.status === "finalizado",
  ).length;

  const statusData = [
    {
      label: getStatusLabel("em_andamento"),
      value: meusProcessos.filter((p) => p.status === "em_andamento").length,
    },
    {
      label: "Aguardando",
      value: meusProcessos.filter((p) => p.status === "aguardando").length,
    },
    { label: "Finalizados", value: processosFinalizados },
    {
      label: "Arquivados",
      value: meusProcessos.filter((p) => p.status === "arquivado").length,
    },
  ];

  const processosRecentes = meusProcessos.slice(0, 4);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: 20,
      }}
    >
      <Card title=" Meus Processos" color="#007bff">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 15,
            marginBottom: 20,
          }}
        >
          <StatItem
            label="Total"
            value={meusProcessos.length}
            color="#007bff"
            icon=""
          />
          <StatItem
            label="Ativos"
            value={processosAtivos}
            color="#28a745"
            icon=""
          />
          <StatItem
            label="Finalizados"
            value={processosFinalizados}
            color="#6c757d"
            icon=""
          />
        </div>

        <div style={{ marginTop: 15 }}>
          <StatusProgressBar
            label="Progresso Geral"
            value={processosFinalizados}
            total={meusProcessos.length}
            color="#28a745"
          />
        </div>
      </Card>

      <Card title=" Status dos Processos" color="#17a2b8">
        <PieChart data={statusData} />
      </Card>

      <Card title=" Processos Recentes (4 mais atualizados)" color="#ffc107">
        {processosRecentes.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {processosRecentes.map((processo, index) => (
              <div
                key={index}
                style={{
                  padding: 12,
                  backgroundColor: "#f8f9fa",
                  borderRadius: 8,
                  borderLeft: `4px solid #ffc107`,
                }}
              >
                <div style={{ fontWeight: "bold", marginBottom: 4 }}>
                  {renderSafeValue(
                    processo.numero_processo || processo.numero,
                    `Processo ${index + 1}`,
                  )}
                </div>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>
                  {renderSafeValue(processo.descricao, "Sem descrição")}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <StatusBadge status={processo.status} />
                  <span style={{ fontSize: 11, color: "#999" }}>
                    {processo.created_at
                      ? formatDate(processo.created_at)
                      : "N/A"}
                  </span>
                </div>
              </div>
            ))}
            {meusProcessos.length > 4 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "8px",
                  color: "#666",
                  fontSize: "12px",
                  fontStyle: "italic",
                }}
              >
                ... e mais {meusProcessos.length - 4} processos
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: "center", color: "#666", padding: 20 }}>
            <p> Nenhum processo encontrado</p>
            <p style={{ fontSize: 12, marginTop: 8 }}>
              Seus processos aparecerão aqui quando forem criados.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

function ProfessoresDashboard({ dashboardData, user }) {
  const processosSupervisionados = Array.isArray(dashboardData?.processos) ? dashboardData.processos : [];
  const alunosOrientados = Array.isArray(dashboardData?.alunos) ? dashboardData.alunos : [];
  const processosAtivos = processosSupervisionados.filter(
    (p) => p.status !== "arquivado",
  ).length;

  const statusData = [
    {
      label: getStatusLabel("em_andamento"),
      value: processosSupervisionados.filter((p) => p.status === "em_andamento")
        .length,
    },
    {
      label: "Aguardando",
      value: processosSupervisionados.filter((p) => p.status === "aguardando")
        .length,
    },
    {
      label: "Finalizados",
      value: processosSupervisionados.filter((p) => p.status === "finalizado")
        .length,
    },
    {
      label: "Arquivados",
      value: processosSupervisionados.filter((p) => p.status === "arquivado")
        .length,
    },
  ];

  const processosRecentes = processosSupervisionados.slice(0, 4);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: 20,
      }}
    >
      <Card title=" Supervisão Acadêmica" color="#28a745">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 15,
            marginBottom: 20,
          }}
        >
          <StatItem
            label="Processos"
            value={processosSupervisionados.length}
            color="#28a745"
            icon=""
          />
          <StatItem
            label="Ativos"
            value={processosAtivos}
            color="#17a2b8"
            icon=""
          />
          <StatItem
            label="Alunos"
            value={alunosOrientados.length}
            color="#ffc107"
            icon=""
          />
        </div>

        <div style={{ marginTop: 15 }}>
          <StatusProgressBar
            label="Processos Finalizados"
            value={
              processosSupervisionados.filter((p) => p.status === "finalizado")
                .length
            }
            total={processosSupervisionados.length}
            color="#28a745"
          />
        </div>
      </Card>

      <Card title=" Distribuição de Status" color="#6f42c1">
        <PieChart data={statusData} />
      </Card>

      <Card
        title=" Processos Supervisionados (4 mais atualizados)"
        color="#dc3545"
      >
        {processosRecentes.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {processosRecentes.map((processo, index) => (
              <div
                key={index}
                style={{
                  padding: 12,
                  backgroundColor: "#f8f9fa",
                  borderRadius: 8,
                  borderLeft: `4px solid #dc3545`,
                }}
              >
                <div style={{ fontWeight: "bold", marginBottom: 4 }}>
                  {renderSafeValue(
                    processo.numero_processo || processo.numero,
                    `Processo ${index + 1}`,
                  )}
                </div>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>
                  Aluno: {renderSafeValue(processo.aluno_nome, "N/A")}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <StatusBadge status={processo.status} />
                  <span style={{ fontSize: 11, color: "#999" }}>
                    {processo.updated_at
                      ? formatDate(processo.updated_at)
                      : "N/A"}
                  </span>
                </div>
              </div>
            ))}
            {processosSupervisionados.length > 4 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "8px",
                  color: "#666",
                  fontSize: "12px",
                  fontStyle: "italic",
                }}
              >
                ... e mais {processosSupervisionados.length - 4} processos
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: "center", color: "#666", padding: 20 }}>
            <p> Nenhum processo sob supervisão</p>
            <p style={{ fontSize: 12, marginTop: 8 }}>
              Processos supervisionados aparecerão aqui.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

function AdminsDashboard({ dashboardData }) {
  const totalProcessos = dashboardData?.processosTotal || 0;
  const totalUsuarios = dashboardData?.totalUsuarios || 0;
  const processosAtivos = dashboardData?.processosAtivos || 0;
  const usuariosAtivos = dashboardData?.usuariosAtivos || 0;

  const statusData = [
    {
      label: getStatusLabel("em_andamento"),
      value: dashboardData?.processosPorStatus?.em_andamento || 0,
    },
    {
      label: "Aguardando",
      value: dashboardData?.processosPorStatus?.aguardando || 0,
    },
    {
      label: "Finalizados",
      value: dashboardData?.processosPorStatus?.finalizado || 0,
    },
    {
      label: "Arquivados",
      value: dashboardData?.processosPorStatus?.arquivado || 0,
    },
  ];

  const usuariosPorTipo = [
    { label: "Alunos", value: dashboardData?.usuariosPorTipo?.aluno || 0 },
    {
      label: "Professores",
      value: dashboardData?.usuariosPorTipo?.professor || 0,
    },
    { label: "Admins", value: dashboardData?.usuariosPorTipo?.admin || 0 },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: 20,
      }}
    >
      <Card title=" Visão Geral do Sistema" color="#6f42c1">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 15,
            marginBottom: 20,
          }}
        >
          <StatItem
            label="Total Processos"
            value={totalProcessos}
            color="#6f42c1"
            icon=""
          />
          <StatItem
            label="Processos Ativos"
            value={processosAtivos}
            color="#28a745"
            icon=""
          />
          <StatItem
            label="Total Usuários"
            value={totalUsuarios}
            color="#17a2b8"
            icon=""
          />
          <StatItem
            label="Usuários Ativos"
            value={usuariosAtivos}
            color="#ffc107"
            icon=""
          />
        </div>

        <div style={{ marginTop: 15 }}>
          <StatusProgressBar
            label="Taxa de Processos Ativos"
            value={processosAtivos}
            total={totalProcessos}
            color="#28a745"
          />
          <StatusProgressBar
            label="Taxa de Usuários Ativos"
            value={usuariosAtivos}
            total={totalUsuarios}
            color="#17a2b8"
          />
        </div>
      </Card>

      <Card title=" Status dos Processos" color="#dc3545">
        <PieChart data={statusData} />
      </Card>

      <Card title=" Tipos de Usuários" color="#fd7e14">
        <PieChart data={usuariosPorTipo} />
      </Card>

      <Card title=" Ações Administrativas" color="#20c997">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            style={{
              padding: 12,
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: "bold",
            }}
          >
            Gerenciar Usuários
          </button>
          <button
            style={{
              padding: 12,
              backgroundColor: "#ffc107",
              color: "#212529",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: "bold",
            }}
          >
            Gerenciar Processos
          </button>
        </div>
      </Card>
    </div>
  );
}

export default function DashboardSummary({ dashboardData, user }) {
  if (!dashboardData || !user) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 200,
          backgroundColor: "#f8f9fa",
          borderRadius: 12,
          color: "#666",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}></div>
          <div>Carregando dashboard...</div>
        </div>
      </div>
    );
  }

  const userRole = getUserRole(user);

  return (
    <div>
      {userRole === "Aluno" && (
        <AlunosDashboard dashboardData={dashboardData} user={user} />
      )}

      {userRole === "Professor" && (
        <ProfessoresDashboard dashboardData={dashboardData} user={user} />
      )}

      {userRole === "Admin" && (
        <AdminsDashboard dashboardData={dashboardData} user={user} />
      )}

      {!["Aluno", "Professor", "Admin"].includes(userRole) && (
        <Card title=" Acesso Restrito" color="#dc3545">
          <div style={{ textAlign: "center", color: "#666", padding: 20 }}>
            <p>Papel de usuário não reconhecido: {userRole}</p>
            <p style={{ fontSize: 12, marginTop: 8 }}>
              Entre em contato com o administrador do sistema.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
