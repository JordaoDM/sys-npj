import { api } from "../api/apiRequest";

const apiService = {
  get: async (url) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error(
          "Token de autenticação não encontrado. Faça login novamente.",
        );
      }

      const response = await api.get(url, token);

      return response;
    } catch (error) {
      if (error.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
      }
      throw error;
    }
  },

  post: async (url, data) => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.post(url, data, token);

      return response;
    } catch (error) {
      throw error;
    }
  },

  put: async (url, data) => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.put(url, data, token);

      return response;
    } catch (error) {
      throw error;
    }
  },

  patch: async (url, data) => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.patch(url, data, token);

      return response;
    } catch (error) {
      throw error;
    }
  },

  delete: async (url) => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.delete(url, token);

      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default apiService;
