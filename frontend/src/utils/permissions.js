export function hasRole(user, roles) {
  if (!user?.role) return false;
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  return allowedRoles.includes(user.role);
}
