import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import SettingsPage from "./pages/SettingsPage";

// URL 쿼리 파라미터로 어떤 페이지를 렌더링할지 결정
const params = new URLSearchParams(window.location.search);
const page = params.get('page');

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {page === 'settings' ? <SettingsPage /> : <App />}
  </React.StrictMode>,
);
