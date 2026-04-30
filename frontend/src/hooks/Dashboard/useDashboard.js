// import { useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   selectDashboardCharts,
//   selectDashboardKPIs,
//   selectDashboardLoading,
//   selectDashboardPanels,
// } from "../../features/dashboard/dashboardSlice";
// import { fetchDashboard } from "../../features/dashboard/dashboardThunks";

// export const useDashboard = () => {
//   const dispatch = useDispatch();

//   const kpis = useSelector(selectDashboardKPIs);
//   const charts = useSelector(selectDashboardCharts);
//   const panels = useSelector(selectDashboardPanels);
//   const loading = useSelector(selectDashboardLoading);

//   useEffect(() => {
//     dispatch(fetchDashboard());
//   }, [dispatch]);

//   return {
//     kpis,
//     charts,
//     panels,
//     loading,
//   };
// };
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  selectDashboardCharts,
  selectDashboardKPIs,
  selectDashboardPanels,
  selectDashboardLearning,
  selectDashboardLoading,
} from "../../features/dashboard/dashboardSlice";

import { fetchDashboard } from "../../features/dashboard/dashboardThunks";

export const useDashboard = () => {
  const dispatch = useDispatch();

  const kpis = useSelector(selectDashboardKPIs);
  const charts = useSelector(selectDashboardCharts);
  const learning = useSelector(selectDashboardLearning);
  const panels = useSelector(selectDashboardPanels);
  const loading = useSelector(selectDashboardLoading);

  useEffect(() => {
    dispatch(fetchDashboard());
  }, [dispatch]);

  return {
    kpis,
    charts,
    learning,
    panels,
    loading,
  };
};
