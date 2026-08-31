
import { useEffect, useRef } from "react";
import { useAuthContext } from "../../contexts/AuthContext";
import { authService } from "../../api/services";

const SESSION_CHECK_INTERVAL = 5 * 60 * 1000;
const INACTIVITY_LIMIT = 30 * 60 * 1000;

export default function SessionValidator() {
  const { token, forceReauth, isAuthenticated, tryRefreshToken } = useAuthContext();
  const lastActivityRef = useRef(Date.now());
  const intervalRef = useRef(null);

  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    events.forEach((event) => {
      document.addEventListener(event, updateActivity, true);
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      return;
    }

    const validateSession = async () => {
      try {
        const inactiveTime = Date.now() - lastActivityRef.current;
        if (inactiveTime > INACTIVITY_LIMIT) {
          forceReauth("Sessão expirada por inatividade. Faça login novamente.");
          return;
        }

        await authService.getProfile(token);
      } catch (error) {
        if (error.status === 401) {
          const refreshed = await tryRefreshToken();
          if (!refreshed) forceReauth("Sua sessão expirou. Faça login novamente.");
        }
      }
    };

    const initialTimeout = setTimeout(validateSession, 60 * 1000);

    intervalRef.current = setInterval(validateSession, SESSION_CHECK_INTERVAL);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAuthenticated, token, forceReauth, tryRefreshToken]);

  return null;
}

export { SESSION_CHECK_INTERVAL, INACTIVITY_LIMIT };
