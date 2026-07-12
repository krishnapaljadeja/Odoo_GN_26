import React from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import App from "./App";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./app/state/store";

const NODE_MOUNT = document.getElementById("root");

axios.defaults.baseURL = import.meta.env.VITE_API_URL || "";
axios.defaults.withCredentials = true;

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <App />
      </PersistGate>
    </Provider>
  </React.StrictMode>,
  NODE_MOUNT,
);
