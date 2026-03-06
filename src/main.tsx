import { createRoot } from "react-dom/client";
import { loadRuntimeConfig } from "@/lib/config";
import App from "./App.tsx";
import "./index.css";

loadRuntimeConfig().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
