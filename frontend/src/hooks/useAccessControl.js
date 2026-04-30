import { useMemo } from "react";
import { useSelector } from "react-redux";

export default function useAccessControl() {
  const {
    user,
    permissions = [],
    initialized,
  } = useSelector((state) => state.auth);

  const role = user?.activeRole?.name || user?.roles?.[0]?.name || "student";

  const permissionSet = useMemo(() => new Set(permissions), [permissions]);

  const isSuperAdmin = role === "admin";

  const can = (perm) => {
    if (!initialized) return false;
    if (isSuperAdmin) return true;

    return (
      permissionSet.has("*") ||
      permissionSet.has(perm) ||
      permissionSet.has(`${perm.split(".")[0]}.*`)
    );
  };

  return {
    user,
    role,
    permissions,
    initialized,
    can,
    isSuperAdmin,
  };
}
