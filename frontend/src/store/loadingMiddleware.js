import { startActionLoading, stopActionLoading } from "../features/ui/uiSlice";

const loadingMiddleware = (store) => (next) => (action) => {
  const { dispatch } = store;

  if (action.type.endsWith("/pending")) {
    dispatch(startActionLoading());
  }

  if (action.type.endsWith("/fulfilled") || action.type.endsWith("/rejected")) {
    dispatch(stopActionLoading());
  }

  return next(action);
};

export default loadingMiddleware;
