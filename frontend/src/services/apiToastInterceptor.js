
import { toastAudit } from "./toastSystemAudit";

const AUTO_TOAST_CONFIG = {
  "auth/login": {
    success: (data) =>
      toastAudit.auth.loginSuccess(data.user?.nome || "Usuário"),
    error: (error) => toastAudit.auth.loginError(error),
  },
  "auth/register": {
    success: (data) =>
      toastAudit.auth.registerSuccess(data.user?.nome || "Usuário"),
    error: (error) => toastAudit.auth.registerError(error),
  },
  "auth/logout": {
    success: () => toastAudit.auth.logoutSuccess(),
  },

  processos: {
    POST: {
      success: (data) =>
        toastAudit.process.createSuccess(
          data.processo?.titulo || data.titulo || "Processo",
        ),
      error: (error) => toastAudit.process.createError(error),
    },
    PUT: {
      success: (data) =>
        toastAudit.process.updateSuccess(
          data.processo?.titulo || data.titulo || "Processo",
        ),
      error: (error) => toastAudit.process.updateError(error),
    },
    DELETE: {
      success: () => toastAudit.process.deleteSuccess("Processo"),
      error: (error) => toastAudit.process.deleteError(error),
    },
  },

  agendamentos: {
    POST: {
      success: (data) =>
        toastAudit.schedule.createSuccess(
          data.data?.titulo || data.titulo || "Agendamento",
        ),
      error: (error) => {
        if (error?.includes("já possui") || error?.includes("conflito")) {
          toastAudit.schedule.conflictError();
        } else {
          toastAudit.schedule.createError(error);
        }
      },
    },
    PUT: {
      success: (data) =>
        toastAudit.schedule.updateSuccess(
          data.data?.titulo || data.titulo || "Agendamento",
        ),
      error: (error) => toastAudit.schedule.createError(error),
    },
    DELETE: {
      success: () => toastAudit.schedule.deleteSuccess("Agendamento"),
      error: (error) =>
        toastAudit.error(`Erro ao remover agendamento: ${error}`),
    },
  },

  usuarios: {
    POST: {
      success: (data) =>
        toastAudit.user.createSuccess(
          data.usuario?.nome || data.nome || "Usuário",
        ),
      error: (error) => toastAudit.user.createError(error),
    },
    PUT: {
      success: (data) =>
        toastAudit.user.updateSuccess(
          data.usuario?.nome || data.nome || "Usuário",
        ),
      error: (error) => toastAudit.user.createError(error),
    },
  },

  arquivos: {
    POST: {
      success: (data) =>
        toastAudit.file.uploadSuccess(
          data.arquivo?.nome || data.nome || "Arquivo",
        ),
      error: (error) => toastAudit.file.uploadError(error),
    },
    DELETE: {
      success: () => toastAudit.file.deleteSuccess("Arquivo"),
      error: (error) => toastAudit.error(`Erro ao remover arquivo: ${error}`),
    },
  },
};

class ApiToastInterceptor {
  constructor() {
    this.enabled = true;
    this.debugMode = false;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  setDebugMode(debug) {
    this.debugMode = debug;
  }

  handleSuccess(url, method, responseData) {
    if (!this.enabled) return;

    try {
      const endpoint = this._extractEndpoint(url);
      const config = this._getEndpointConfig(endpoint, method);

      if (config?.success) {
        if (this.debugMode) {
          console.log(
            ` Auto-toast sucesso: ${endpoint} [${method}]`,
            responseData,
          );
        }
        config.success(responseData);
      }
    } catch (error) {
      console.error("Erro no interceptor de sucesso:", error);
    }
  }

  handleError(url, method, error) {
    if (!this.enabled) return;

    try {
      const endpoint = this._extractEndpoint(url);
      const config = this._getEndpointConfig(endpoint, method);

      if (config?.error) {
        if (this.debugMode) {
          console.log(` Auto-toast erro: ${endpoint} [${method}]`, error);
        }
        config.error(error);
      } else {
        this._handleGenericError(error, endpoint, method);
      }
    } catch (interceptorError) {
      console.error("Erro no interceptor de erro:", interceptorError);
    }
  }

  _extractEndpoint(url) {
    const cleanUrl = url.replace(/^.*\/api\//, "").split("?")[0];

    return cleanUrl.replace(/\/\d+$/, "").replace(/\/\d+\//, "/");
  }

  _getEndpointConfig(endpoint, method) {
    const config = AUTO_TOAST_CONFIG[endpoint];

    if (!config) return null;

    if (config[method]) {
      return config[method];
    }

    if (config.success || config.error) {
      return config;
    }

    return null;
  }

  _handleGenericError(error, endpoint, method) {
    if (this.debugMode) {
      console.log(` Erro genérico: ${endpoint} [${method}]`, error);
    }

    if (typeof error === "string") {
      if (error.includes("Network Error") || error.includes("fetch")) {
        toastAudit.system.networkError();
        return;
      }

      if (error.includes("500") || error.includes("Internal Server Error")) {
        toastAudit.system.serverError();
        return;
      }

      if (error.includes("401") || error.includes("Unauthorized")) {
        toastAudit.auth.unauthorized();
        return;
      }

      if (error.includes("403") || error.includes("Forbidden")) {
        toastAudit.auth.unauthorized();
        return;
      }
    }

    toastAudit.error(`Erro na operação: ${error}`);
  }

  wrapApiCall(apiFunction, url, options = {}) {
    return async (...args) => {
      try {
        const result = await apiFunction(...args);

        this.handleSuccess(url, options.method || "GET", result);

        return result;
      } catch (error) {
        this.handleError(url, options.method || "GET", error?.message || error);

        throw error;
      }
    };
  }

  setupGlobalInterception() {
    if (typeof window !== "undefined" && window.fetch) {
      const originalFetch = window.fetch;

      window.fetch = async (url, options = {}) => {
        try {
          const response = await originalFetch(url, options);

          if (response.ok) {
            const data = await response
              .clone()
              .json()
              .catch(() => ({}));
            this.handleSuccess(url, options.method || "GET", data);
          } else {
            const errorData = await response
              .clone()
              .json()
              .catch(() => ({}));
            this.handleError(
              url,
              options.method || "GET",
              errorData.message || `HTTP ${response.status}`,
            );
          }

          return response;
        } catch (error) {
          this.handleError(
            url,
            options.method || "GET",
            error.message || error,
          );
          throw error;
        }
      };
    }
  }

  removeGlobalInterception() {
  }
}

export const apiToastInterceptor = new ApiToastInterceptor();
export default apiToastInterceptor;
