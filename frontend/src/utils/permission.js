export const hasPermission = (user, permission) => {
  if (!user?.permissions) return false;

  return user.permissions.includes(permission);
};

export const hasAnyPermission = (user, permissions = []) => {
  if (!user?.permissions) return false;

  return permissions.some((p) => user.permissions.includes(p));
};

export const hasAllPermissions = (user, permissions = []) => {
  if (!user?.permissions) return false;

  return permissions.every((p) => user.permissions.includes(p));
};
