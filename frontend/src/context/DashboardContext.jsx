import { createContext, useContext, useMemo } from "react";
import { useSelector } from "react-redux";

const AccessControlContext = createContext();

export const AccessControlProvider = ({ children }) => {
  const { user, permissions = [], initialized } = useSelector((s) => s.auth);

  const role = user?.activeRole?.name;

  const can = useMemo(() => {
    return (perm) => {
      if (!initialized) return false;

      return (
        permissions.includes("*") ||
        permissions.includes(perm) ||
        permissions.includes(`${perm.split(".")[0]}.*`)
      );
    };
  }, [permissions, initialized]);

  return (
    <AccessControlContext.Provider
      value={{
        role,
        permissions,
        can,
        initialized,
      }}
    >
      {children}
    </AccessControlContext.Provider>
  );
};

export const useAccessControlContext = () => useContext(AccessControlContext);
