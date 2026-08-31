export const NPJ_CONFIG = {
  API: {
    BASE_URL: import.meta.env.VITE_API_URL || "http://localhost:3001",
    TIMEOUT: 10000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
  },

  CACHE: {
    DEFAULT_TTL: 2 * 60 * 1000,
    MAX_SIZE: 200,
    CLEANUP_INTERVAL: 60 * 1000,
    PRIORITIES: {
      high: 30 * 1000,
      medium: 2 * 60 * 1000,
      low: 30 * 60 * 1000,
    },
  },

  AUTH: {
    TOKEN_REFRESH_BEFORE: 2 * 60 * 1000,
    AUTO_LOGOUT_AFTER: 30 * 60 * 1000,
    CHECK_INTERVAL: 60 * 1000,
  },

  UI: {
    DEBOUNCE_DELAY: 800,
    LOADING_MIN_TIME: 500,
    TOAST_DURATION: 4000,
    PAGINATION_SIZE: 20,
  },
};

export const ERROR_CODES = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 422,
  SERVER_ERROR: 500,
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT: "TIMEOUT",
};

export const ERROR_MESSAGES = {
  [ERROR_CODES.BAD_REQUEST]: "Dados inválidos na requisição.",
  [ERROR_CODES.UNAUTHORIZED]: "Sessão expirada. Faça login novamente.",
  [ERROR_CODES.FORBIDDEN]: "Você não tem permissão para esta ação.",
  [ERROR_CODES.NOT_FOUND]: "Recurso não encontrado.",
  [ERROR_CODES.VALIDATION_ERROR]: "Dados inválidos. Verifique os campos.",
  [ERROR_CODES.SERVER_ERROR]: "Erro interno do servidor. Tente novamente.",
  [ERROR_CODES.NETWORK_ERROR]: "Erro de conexão. Verifique sua internet.",
  [ERROR_CODES.TIMEOUT]: "Tempo limite excedido. Tente novamente.",
};

export const ROUTE_CONFIG = {
  "/api/usuarios/me": {
    cache: { ttl: 5 * 60 * 1000, priority: "high" },
    retry: { attempts: 2, delay: 500 },
  },
  "/api/processos": {
    cache: { ttl: 2 * 60 * 1000, priority: "medium" },
    retry: { attempts: 3, delay: 1000 },
  },
  "/api/agendamentos": {
    cache: { ttl: 1 * 60 * 1000, priority: "high" },
    retry: { attempts: 2, delay: 500 },
  },
  "/api/aux": {
    cache: { ttl: 30 * 60 * 1000, priority: "low" },
    retry: { attempts: 1, delay: 2000 },
  },
};

export function getRouteConfig(url) {
  if (typeof url !== "string") {
    console.warn(" getRouteConfig: URL inválida:", url);
    return {
      cache: { ttl: NPJ_CONFIG.CACHE.DEFAULT_TTL, priority: "medium" },
      retry: {
        attempts: NPJ_CONFIG.API.RETRY_ATTEMPTS,
        delay: NPJ_CONFIG.API.RETRY_DELAY,
      },
    };
  }

  for (const [pattern, config] of Object.entries(ROUTE_CONFIG)) {
    if (url.includes(pattern)) {
      return config;
    }
  }
  return {
    cache: { ttl: NPJ_CONFIG.CACHE.DEFAULT_TTL, priority: "medium" },
    retry: {
      attempts: NPJ_CONFIG.API.RETRY_ATTEMPTS,
      delay: NPJ_CONFIG.API.RETRY_DELAY,
    },
  };
}

export const LOADING_STATES = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
};

export const NOTIFICATION_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
};

export default NPJ_CONFIG;
