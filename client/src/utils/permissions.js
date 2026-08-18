export const ROLE_PERMISSIONS = {
  admin: ['admin', 'coordinator', 'user'],
  coordinator: ['coordinator', 'user'],
  user: ['user'],
};

export const canAccess = (userRole, allowedRoles = []) => {
  if (!userRole || !allowedRoles.length) return true;
  return allowedRoles.includes(userRole);
};
