import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { store, persistor } from "./store/store";
import BrandLoading from "./components/ui/BrandLoading.jsx";
import { ChatSocketProvider } from "./context/ChatSocketProvider.jsx";
import AppBootstrap from "./context/AppBootstrap.jsx";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/free-mode";

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <Provider store={store}>
    <PersistGate
      loading={<BrandLoading className="fade-in" />}
      persistor={persistor}
    >
      <BrowserRouter>
        <ChatSocketProvider>
          <AppBootstrap>
            <App />
          </AppBootstrap>
        </ChatSocketProvider>
      </BrowserRouter>
    </PersistGate>
  </Provider>
);
