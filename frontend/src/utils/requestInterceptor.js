import {
  NPJ_CONFIG,
  ERROR_CODES,
  ERROR_MESSAGES,
  getRouteConfig,
} from "../config/npjConfig";

class RequestInterceptor {
  constructor() {
    this.activeRequests = new Set();
    this.retryCount = new Map();
  }

  async interceptRequest(url, options = {}) {
    const config = getRouteConfig(url);

    if (!options.timeout) {
      options.timeout = NPJ_CONFIG.API.TIMEOUT;
    }

    const token = options.token || localStorage.getItem("token");
    if (token) {
      options.headers = {
        "Content-Type": "application/json",
        ...options.headers,
        Authorization: `Bearer ${token}`,
      };
    } else if (options.body && typeof options.body === "string") {
      options.headers = {
        "Content-Type": "application/json",
        ...options.headers,
      };
    }

    try {
      const response = await this.executeRequest(url, options, config);
      return response;
    } finally {
      this.retryCount.delete(`${options.method || "GET"}:${url}`);
    }
  }

  async executeRequest(url, options, config, attempt = 1) {
    const maxAttempts = config.retry?.attempts || NPJ_CONFIG.API.RETRY_ATTEMPTS;

    try {
      const response = await this.makeRequest(url, options);
      return response;
    } catch (error) {
      if (attempt < maxAttempts && this.shouldRetry(error)) {
        const delay = config.retry?.delay || NPJ_CONFIG.API.RETRY_DELAY;
        const backoffDelay = delay * Math.pow(2, attempt - 1);

        await this.sleep(backoffDelay);
        return this.executeRequest(url, options, config, attempt + 1);
      }

      throw this.normalizeError(error);
    }
  }

  async makeRequest(url, options) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout);

    try {
      const response = await fetch(`${NPJ_CONFIG.API.BASE_URL}${url}`, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        let errorData = null;

        try {
          const responseText = await response.text();
          if (responseText) {
            errorData = JSON.parse(responseText);
            errorMessage =
              errorData.message ||
              errorData.detalhes ||
              errorMessage;
          }
        } catch (parseError) {
          console.warn(
            "Não foi possível extrair erro do corpo da resposta:",
            parseError,
          );
        }

        throw {
          status: response.status,
          statusText: response.statusText,
          message: errorMessage,
          data: errorData,
          url,
        };
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === "AbortError") {
        throw { code: ERROR_CODES.TIMEOUT, message: "Request timeout", url };
      }

      throw error;
    }
  }

  shouldRetry(error) {
    if (error.status === ERROR_CODES.UNAUTHORIZED) {
      return false;
    }

    if (error.status === ERROR_CODES.FORBIDDEN) {
      return false;
    }

    return [
      ERROR_CODES.NETWORK_ERROR,
      ERROR_CODES.TIMEOUT,
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      ERROR_CODES.BAD_GATEWAY,
      ERROR_CODES.SERVICE_UNAVAILABLE,
      ERROR_CODES.GATEWAY_TIMEOUT,
    ].includes(error.status);
  }

  normalizeError(error) {
    if (error.code) return error;

    const statusToCode = {
      400: ERROR_CODES.BAD_REQUEST,
      401: ERROR_CODES.UNAUTHORIZED,
      403: ERROR_CODES.FORBIDDEN,
      404: ERROR_CODES.NOT_FOUND,
      422: ERROR_CODES.VALIDATION_ERROR,
      500: ERROR_CODES.INTERNAL_SERVER_ERROR,
      502: ERROR_CODES.BAD_GATEWAY,
      503: ERROR_CODES.SERVICE_UNAVAILABLE,
      504: ERROR_CODES.GATEWAY_TIMEOUT,
    };

    const code = statusToCode[error.status] || ERROR_CODES.NETWORK_ERROR;

    return {
      code,
      message: error.message || ERROR_MESSAGES[code] || "Erro desconhecido",
      status: error.status,
      data: error.data,
      url: error.url,
      originalError: error,
    };
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  clear() {
    this.activeRequests.clear();
    this.retryCount.clear();
  }
}

export const requestInterceptor = new RequestInterceptor();

export async function interceptedRequest(url, options = {}) {
  const response = await requestInterceptor.interceptRequest(url, options);

  if (!response) {
    throw new Error("Erro na requisição");
  }

  if (typeof response === "object" && !response.json) {
    return response;
  }

  if (typeof response.json === "function") {
    const data = await response.json();
    return data;
  }

  return response;
}

export default requestInterceptor;
