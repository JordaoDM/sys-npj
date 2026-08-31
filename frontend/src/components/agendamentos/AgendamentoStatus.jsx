import React from "react";
import { getStatusDescription, getStatusLabel } from "@/utils/commonUtils";

const AgendamentoStatus = ({
  status,
  convidados = [],
  dataConvitesEnviados = null,
  className = "",
  showDescription = true,
}) => {
  const getStatusInfo = () => {
    switch (status) {
      case "em_analise":
        return {
          text: getStatusLabel(status),
          icon: "",
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          description: getStatusDescription(status),
        };
      case "aprovado":
        return {
          text: getStatusLabel(status),
          icon: "",
          color: "bg-green-100 text-green-800 border-green-200",
          description: getStatusDescription(status),
        };
      case "recusado":
        return {
          text: getStatusLabel(status),
          icon: "",
          color: "bg-red-100 text-red-800 border-red-200",
          description: getStatusDescription(status),
        };
      case "cancelado":
        return {
          text: getStatusLabel(status),
          icon: "",
          color: "bg-gray-100 text-gray-800 border-gray-200",
          description: getStatusDescription(status),
        };
      case "pendente":
        return {
          text: getStatusLabel(status),
          icon: "",
          color: "bg-blue-100 text-blue-800 border-blue-200",
          description: getStatusDescription(status),
        };
      case "enviando_convites":
        return {
          text: getStatusLabel(status),
          icon: "",
          color: "bg-purple-100 text-purple-800 border-purple-200",
          description: getStatusDescription(status),
        };
      case "agendado":
      case "marcado":
        return {
          text: getStatusLabel(status),
          icon: "",
          color: "bg-indigo-100 text-indigo-800 border-indigo-200",
          description: getStatusDescription(status),
        };
      case "concluido":
      case "finalizado":
        return {
          text: getStatusLabel(status),
          icon: "",
          color: "bg-green-100 text-green-800 border-green-200",
          description: getStatusDescription(status),
        };
      default:
        return {
          text: getStatusLabel(status),
          icon: "",
          color: "bg-gray-100 text-gray-800 border-gray-200",
          description: getStatusDescription(status),
        };
    }
  };

  const getConvidadosInfo = () => {
    if (!convidados || convidados.length === 0) {
      return null;
    }

    const aceitos = convidados.filter((c) => c.status === "aceito").length;
    const recusados = convidados.filter((c) => c.status === "recusado").length;
    const pendentes = convidados.filter((c) => c.status === "pendente").length;
    const total = convidados.length;

    return {
      total,
      aceitos,
      recusados,
      pendentes,
      porcentagemResposta: Math.round(((aceitos + recusados) / total) * 100),
    };
  };

  const getTempoRestanteConvites = () => {
    if (!dataConvitesEnviados || status !== "pendente") {
      return null;
    }

    const agora = new Date();
    const dataEnvio = new Date(dataConvitesEnviados);
    const horasPassadas = (agora - dataEnvio) / (1000 * 60 * 60);
    const horasRestantes = Math.max(0, 24 - horasPassadas);

    if (horasRestantes <= 0) {
      return { expirado: true };
    }

    return {
      expirado: false,
      horas: Math.floor(horasRestantes),
      minutos: Math.floor((horasRestantes % 1) * 60),
      urgente: horasRestantes < 2,
      aviso: horasRestantes < 6,
    };
  };

  const statusInfo = getStatusInfo();
  const convidadosInfo = getConvidadosInfo();
  const tempoRestante = getTempoRestanteConvites();

  return (
    <div className={`inline-flex flex-col items-start ${className}`}>
      <div
        className={`inline-flex h-7 items-center whitespace-nowrap rounded-full border px-3 text-xs font-semibold leading-none ${statusInfo.color}`}
      >
        {statusInfo.icon && <span className="mr-1.5">{statusInfo.icon}</span>}
        <span>{statusInfo.text}</span>
      </div>

      {convidadosInfo && (
        <div className="mt-2 text-xs text-gray-600">
          <div className="flex items-center space-x-4">
            <span>
              {" "}
              {convidadosInfo.total} convidado
              {convidadosInfo.total !== 1 ? "s" : ""}
            </span>
            {convidadosInfo.aceitos > 0 && (
              <span className="text-green-600"> {convidadosInfo.aceitos}</span>
            )}
            {convidadosInfo.recusados > 0 && (
              <span className="text-red-600"> {convidadosInfo.recusados}</span>
            )}
            {convidadosInfo.pendentes > 0 && (
              <span className="text-yellow-600">
                {" "}
                {convidadosInfo.pendentes}
              </span>
            )}
            <span className="text-gray-500">
              ({convidadosInfo.porcentagemResposta}% responderam)
            </span>
          </div>
        </div>
      )}

      {tempoRestante && (
        <div className="mt-2">
          {tempoRestante.expirado ? (
            <div className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
              Convites expiraram - aceitos automaticamente
            </div>
          ) : (
            <div
              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                tempoRestante.urgente
                  ? "bg-red-100 text-red-800"
                  : tempoRestante.aviso
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-blue-100 text-blue-800"
              }`}
            >
              Restam {tempoRestante.horas}h {tempoRestante.minutos}min
              {tempoRestante.urgente && " - URGENTE!"}
            </div>
          )}
        </div>
      )}

      {showDescription && (
        <div className="mt-1 text-xs text-gray-500">{statusInfo.description}</div>
      )}
    </div>
  );
};

export default AgendamentoStatus;
