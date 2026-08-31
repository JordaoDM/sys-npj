
import { useCallback, useEffect, useRef } from "react";
import { toastAudit } from "./toastSystemAudit";
import { apiToastInterceptor } from "./apiToastInterceptor";

export const useToastAudit = () => {
  return {
    auth: toastAudit.auth,

    process: toastAudit.process,

    schedule: toastAudit.schedule,

    user: toastAudit.user,

    file: toastAudit.file,

    validation: toastAudit.validation,

    system: toastAudit.system,

    success: toastAudit.success,
    error: toastAudit.error,
    warning: toastAudit.warning,
    info: toastAudit.info,

    clear: toastAudit.clear,
    getActiveToasts: toastAudit.getActiveToasts,
  };
};

export const useApiWithToast = () => {
  const pendingRequests = useRef(new Set());

  const executeApi = useCallback(async (apiFunction, options = {}) => {
    const {
      url = "",
      method = "GET",
      showLoading = false,
      loadingMessage = "Processando...",
      preventDuplicateLoading = true,
      onSuccess,
      onError,
      successMessage,
      errorMessage,
    } = options;

    const requestKey = `${method}:${url}`;
    if (preventDuplicateLoading && pendingRequests.current.has(requestKey)) {
      toastAudit.warning("Operação já em andamento...");
      return;
    }

    if (preventDuplicateLoading) {
      pendingRequests.current.add(requestKey);
    }

    let loadingToastId = null;
    if (showLoading) {
      loadingToastId = toastAudit.info(loadingMessage, { autoClose: false });
    }

    try {
      const result = await apiFunction();

      if (loadingToastId) {
        toastAudit.clear(loadingToastId);
      }

      if (successMessage) {
        toastAudit.success(successMessage);
      } else {
        apiToastInterceptor.handleSuccess(url, method, result);
      }

      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (error) {
      if (loadingToastId) {
        toastAudit.clear(loadingToastId);
      }

      if (errorMessage) {
        toastAudit.error(errorMessage);
      } else {
        apiToastInterceptor.handleError(url, method, error?.message || error);
      }

      if (onError) {
        onError(error);
      }

      throw error;
    } finally {
      if (preventDuplicateLoading) {
        pendingRequests.current.delete(requestKey);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      pendingRequests.current.clear();
    };
  }, []);

  return {
    executeApi,
    clearPendingRequests: () => pendingRequests.current.clear(),
  };
};

export const useFormValidationToast = () => {
  const toast = useToastAudit();

  const validateRequired = useCallback(
    (value, fieldName) => {
      if (!value || (typeof value === "string" && value.trim() === "")) {
        toast.validation.requiredField(fieldName);
        return false;
      }
      return true;
    },
    [toast],
  );

  const validateEmail = useCallback(
    (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.validation.invalidEmail();
        return false;
      }
      return true;
    },
    [toast],
  );

  const validatePassword = useCallback(
    (password, minLength = 6) => {
      if (!password || password.length < minLength) {
        toast.validation.invalidFormat(
          `Senha deve ter pelo menos ${minLength} caracteres`,
        );
        return false;
      }
      return true;
    },
    [toast],
  );

  const validatePasswordConfirmation = useCallback(
    (password, confirmation) => {
      if (password !== confirmation) {
        toast.validation.invalidFormat("Senhas não coincidem");
        return false;
      }
      return true;
    },
    [toast],
  );

  const validateDate = useCallback(
    (date, fieldName = "Data") => {
      if (!date || isNaN(new Date(date).getTime())) {
        toast.validation.invalidFormat(`${fieldName} inválida`);
        return false;
      }
      return true;
    },
    [toast],
  );

  const validateFutureDate = useCallback(
    (date, fieldName = "Data") => {
      if (!validateDate(date, fieldName)) return false;

      if (new Date(date) <= new Date()) {
        toast.validation.invalidFormat(`${fieldName} deve ser futura`);
        return false;
      }
      return true;
    },
    [toast],
  );

  return {
    validateRequired,
    validateEmail,
    validatePassword,
    validatePasswordConfirmation,
    validateDate,
    validateFutureDate,
    toast,
  };
};

export const useCrudToast = (entityName = "Item") => {
  const toast = useToastAudit();
  const { executeApi } = useApiWithToast();

  const create = useCallback(
    async (apiFunction, data) => {
      return executeApi(apiFunction, {
        url: `${entityName.toLowerCase()}s`,
        method: "POST",
        showLoading: true,
        loadingMessage: `Criando ${entityName.toLowerCase()}...`,
      });
    },
    [executeApi, entityName],
  );

  const update = useCallback(
    async (apiFunction, id, data) => {
      return executeApi(apiFunction, {
        url: `${entityName.toLowerCase()}s/${id}`,
        method: "PUT",
        showLoading: true,
        loadingMessage: `Atualizando ${entityName.toLowerCase()}...`,
      });
    },
    [executeApi, entityName],
  );

  const remove = useCallback(
    async (apiFunction, id) => {
      return executeApi(apiFunction, {
        url: `${entityName.toLowerCase()}s/${id}`,
        method: "DELETE",
        showLoading: true,
        loadingMessage: `Removendo ${entityName.toLowerCase()}...`,
      });
    },
    [executeApi, entityName],
  );

  const list = useCallback(
    async (apiFunction) => {
      return executeApi(apiFunction, {
        url: `${entityName.toLowerCase()}s`,
        method: "GET",
        showLoading: false,
      });
    },
    [executeApi, entityName],
  );

  return {
    create,
    update,
    remove,
    list,
    toast,
  };
};

export const setupGlobalToastInterception = () => {
  apiToastInterceptor.setupGlobalInterception();
};

export const removeGlobalToastInterception = () => {
  apiToastInterceptor.removeGlobalInterception();
};

export const setToastDebugMode = (enabled) => {
  apiToastInterceptor.setDebugMode(enabled);
};

export default {
  useToastAudit,
  useApiWithToast,
  useFormValidationToast,
  useCrudToast,
  setupGlobalToastInterception,
  removeGlobalToastInterception,
  setToastDebugMode,
};
