import React from "react";

const ErrorDisplay = ({
  error,
  onRetry,
  title = "Algo deu errado",
  showDetails = false,
  className = "",
}) => {
  const getErrorMessage = (error) => {
    if (typeof error === "string") return error;
    if (error?.message) return error.message;
    if (error?.erro) return error.erro;
    return "Ocorreu um erro inesperado. Tente novamente.";
  };

  const getErrorIcon = (error) => {
    const message = getErrorMessage(error).toLowerCase();
    if (message.includes("rede") || message.includes("conexão")) return "";
    if (message.includes("permiss") || message.includes("autoriza")) return "";
    if (message.includes("não encontrado") || message.includes("404"))
      return "";
    return "";
  };

  return (
    <div
      className={`bg-red-50 border border-red-200 rounded-lg p-6 text-center ${className}`}
    >
      <div className="text-4xl mb-3">{getErrorIcon(error)}</div>

      <h3 className="text-lg font-semibold text-red-800 mb-2">{title}</h3>

      <p className="text-red-700 mb-4">{getErrorMessage(error)}</p>

      {showDetails && error?.stack && (
        <details className="mb-4">
          <summary className="cursor-pointer text-sm text-red-600 hover:text-red-800">
            Ver detalhes técnicos
          </summary>
          <pre className="mt-2 text-xs text-left bg-red-100 p-2 rounded overflow-auto max-h-32">
            {error.stack}
          </pre>
        </details>
      )}

      <div className="flex gap-3 justify-center">
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            Tentar Novamente
          </button>
        )}

        <button
          onClick={() => window.location.reload()}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
        >
          Recarregar Página
        </button>
      </div>
    </div>
  );
};

export default ErrorDisplay;
