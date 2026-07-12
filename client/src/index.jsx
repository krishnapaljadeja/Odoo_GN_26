import React from "react";
import { createRoot } from "react-dom/client";
import axios from "axios";
import "./app/styles/tailwind.css";
import App from "./App";
import { Analytics } from "@vercel/analytics/react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./app/state/store";
import { Toaster } from "./app/components/ui";

const NODE_MOUNT = document.getElementById("root");

axios.defaults.baseURL = import.meta.env.VITE_API_URL || "";
axios.defaults.withCredentials = true;

createRoot(NODE_MOUNT).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <App />
        <Toaster />
        <Analytics />
      </PersistGate>
    </Provider>
  </React.StrictMode>,
);
