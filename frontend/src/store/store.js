import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./rootReducer.js";
import loadingMiddleware from "./loadingMiddleware";

// Nếu dùng persist
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";

// Cấu hình redux-persist (nếu muốn lưu auth)
const persistConfig = {
  key: "root",
  version: 1,
  storage,
  whitelist: ["auth"], // chỉ persist auth
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// configure store với middleware custom
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoreActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
      thunk: true, // Redux Thunk để xử lý async
    }).concat(loadingMiddleware), // ✅ add middleware của bạn vào
});

export const persistor = persistStore(store);

export default { store, persistor };
