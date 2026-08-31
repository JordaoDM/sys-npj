import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from "react";
import { authService } from "../api/services";
import { toastAudit } from "../services/toastSystemAudit";
import Loader from "../components/common/Loader";

const AuthContext = createContext();
const SESSION_ERROR_KEY = "login:last-error";

const readStoredUser = () => {
  try {
    const value = localStorage.getItem("user");
    return value ? JSON.parse(value) : null;
  } catch {
    localStorage.removeItem("user");
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [refreshToken, setRefreshToken] = useState(
    () => localStorage.getItem("refreshToken") || "",
  );
  const [loading, setLoading] = useState(false);
  const refreshPromiseRef = useRef(null);

  const clearSession = useCallback(() => {
    setUser(null);
    setToken("");
    setRefreshToken("");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
  }, []);

  const forceReauth = useCallback((message = "Sua sessão expirou. Faça login novamente.") => {
    clearSession();
    sessionStorage.setItem(SESSION_ERROR_KEY, message);
    if (window.location.pathname !== "/login") {
      window.location.replace("/login");
    }
  }, [clearSession]);

  const tryRefreshToken = useCallback(async () => {
    const storedRefreshToken = localStorage.getItem("refreshToken") || refreshToken;
    if (!storedRefreshToken) return false;
    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    refreshPromiseRef.current = (async () => {
      try {
        const data = await authService.refreshToken(storedRefreshToken);
        if (!data.success || !data.token) return false;
        setToken(data.token);
        localStorage.setItem("token", data.token);
        if (data.refreshToken) {
          setRefreshToken(data.refreshToken);
          localStorage.setItem("refreshToken", data.refreshToken);
        }
        if (data.usuario) setUser(data.usuario);
        return data.token;
      } catch {
        return false;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    return refreshPromiseRef.current;
  }, [refreshToken]);

  useEffect(() => {
    if (user && token) {
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
    }
  }, [user, token, refreshToken]);

  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          setLoading(true);
          const profileData = await authService.getProfile(token);

          if (user && user.id !== profileData.id) {
            forceReauth(
              "Dados do usuário foram alterados. Faça login novamente.",
            );
            return;
          }

          setUser(profileData);
        } catch (error) {
          if (error.status === 401) {
            const refreshed = await tryRefreshToken();
            if (!refreshed) {
              forceReauth("Sua sessão expirou. Faça login novamente.");
            }
          }
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  const login = async (email, senha) => {
    setLoading(true);
    try {
      const data = await authService.login(email, senha);
      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.usuario));
        localStorage.setItem("token", data.token);
        if (data.refreshToken) {
          localStorage.setItem("refreshToken", data.refreshToken);
        }
        setUser(data.usuario);
        setToken(data.token);
        setRefreshToken(data.refreshToken);
        setLoading(false);
        sessionStorage.removeItem(SESSION_ERROR_KEY);
        return { success: true, user: data.usuario };
      } else {
        setLoading(false);
        return {
          success: false,
          message: data.message || "Erro ao fazer login",
        };
      }
    } catch (err) {
      setLoading(false);
      return {
        success: false,
        message: err.message || "Erro ao fazer login",
        status: err.status || null,
      };
    }
  };

  const register = async (nome, email, senha, telefone) => {
    setLoading(true);
    try {
      await authService.register(nome, email, senha, telefone);
      setLoading(false);
      return { success: true };
    } catch (err) {
      setLoading(false);
      return { success: false, message: err.message || "Erro ao registrar" };
    }
  };

  const forgotPassword = async (email) => {
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setLoading(false);
      return { success: true };
    } catch (err) {
      setLoading(false);
      return {
        success: false,
        message: err.message || "Erro ao solicitar recuperação",
      };
    }
  };

  const logout = () => {
    const currentToken = localStorage.getItem("token") || token;
    const currentRefreshToken = localStorage.getItem("refreshToken") || refreshToken;
    if (currentToken) {
      authService.logout(currentToken, currentRefreshToken).catch(() => {});
    }
    clearSession();
    sessionStorage.removeItem(SESSION_ERROR_KEY);
    toastAudit.auth.logoutSuccess();
  };

  if (loading) return <Loader text="Verificando autenticação..." />;

  const fetchWithAuth = async (fn, ...args) => {
    try {
      return await fn(token, ...args);
    } catch (err) {
      if (err.status === 401 || err.message?.toLowerCase().includes("401")) {
        const refreshed = await tryRefreshToken();
        if (refreshed) {
          return await fn(refreshed, ...args);
        }
        forceReauth("Sua sessão expirou. Faça login novamente.");
        throw Object.assign(new Error("Sessão expirada"), { status: 401 });
      }

      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        token,
        refreshToken,
        login,
        register,
        forgotPassword,
        logout,
        forceReauth,
        loading,
        isAuthenticated: !!user,
        fetchWithAuth,
        tryRefreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useAuthContext() {
  return useContext(AuthContext);
}
