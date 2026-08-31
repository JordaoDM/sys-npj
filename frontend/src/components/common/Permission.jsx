import { useAuthContext } from "../../contexts/AuthContext";
import { hasRole } from "../../utils/permissions";

export default function Permission({ roles, children }) {
  const { user } = useAuthContext();
  if (hasRole(user, roles)) return children;
  return null;
}
