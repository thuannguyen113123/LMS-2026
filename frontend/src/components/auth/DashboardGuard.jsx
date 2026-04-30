import { useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { selectSidebarModules } from "../../features/modules/modulesSlice";
import { fetchSidebarModules } from "../../features/modules/modulesThunks";
import { useEffect } from "react";

const DashboardGuard = () => {
  const location = useLocation();
  const dispatch = useDispatch();

  const roles = useSelector((s) => s.auth.user?.roles || []);
  const activeRole = useSelector((s) => s.auth.user?.activeRole);

  const sidebarLoading = useSelector((s) => s.modules.sidebarLoading);
  const modules = useSelector(selectSidebarModules);
  const sidebarFetched = useSelector((s) => s.modules.sidebarFetched);

  console.log("=== DASHBOARD GUARD ===");
  console.log("roles:", roles);
  console.log("activeRole:", activeRole);
  console.log("sidebarFetched:", sidebarFetched);
  console.log("currentPath:", location.pathname);

  // ✅ fetch sidebar theo role
  useEffect(() => {
    if (activeRole && !sidebarFetched && !sidebarLoading) {
      dispatch(fetchSidebarModules());
    }
  }, [dispatch, activeRole, sidebarFetched, sidebarLoading]);

  // ❌ chưa login hoặc chưa có role
  if (!roles.length) {
    return <Navigate to="/" replace />;
  }

  // 🔥 CHƯA CHỌN ROLE → bắt chọn
  if (!activeRole) {
    return <Navigate to="/select-role" replace />;
  }

  // ⏳ chờ sidebar load xong
  if (!sidebarFetched) return null;

  // ✅ cho vào dashboard root
  if (location.pathname === "/dashboard") {
    return <Outlet />;
  }

  // ✅ check quyền route
  const allowedPaths = Object.values(modules)
    .flat()
    .map((m) => m.path);

  const isAllowed = allowedPaths.some((path) =>
    location.pathname.startsWith(path)
  );

  if (!isAllowed) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default DashboardGuard;
