import React from "react";
import ReactDOM from "react-dom/client";
import MessagesPage from "./pages/MessagesPage";
import "./styles/App.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MessagesPage />
  </React.StrictMode>
);
