import React, { createContext, useContext } from "react";
import { toastService } from "../services/toastService";

const ToastContext = createContext();

export const useGlobalToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useGlobalToast deve ser usado dentro de ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const toastMethods = {
    showSuccess: (message, duration) => {
      toastService.success(message);
    },
    showError: (message, duration) => {
      toastService.error(message);
    },
    showWarning: (message, duration) => {
      toastService.warning(message);
    },
    showInfo: (message, duration) => {
      toastService.info(message);
    },
  };

  return (
    <ToastContext.Provider value={toastMethods}>
      {children}
    </ToastContext.Provider>
  );
};

export default ToastProvider;
