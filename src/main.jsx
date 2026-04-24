import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";
import { Provider } from "react-redux";
import App from "./App";
import store from "./store/store";
import "./index.css";

const bootstrapDefaultTitle = () => {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const headTitle = document.querySelector("head > title")?.textContent?.trim();
  const currentTitle = String(document.title || "").trim();
  const defaultTitle = headTitle || currentTitle;

  if (defaultTitle && !window.__APP_DEFAULT_TITLE__) {
    window.__APP_DEFAULT_TITLE__ = defaultTitle;
  }
};

bootstrapDefaultTitle();


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Provider store={store}>
        <App />
      </Provider>
    </BrowserRouter>
  </React.StrictMode>
);
