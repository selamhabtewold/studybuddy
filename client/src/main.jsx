import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App"; // Import App instead of Layout

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App /> {/* Ensure App is rendered, so routing works */}
  </StrictMode>
);
