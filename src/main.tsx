import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./tweakcn/components/theme-provider";
import { TooltipProvider } from "./tweakcn/components/ui/tooltip";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      {/* @ts-ignore */}
      <TooltipProvider delayDuration={0}>
        <App />
      </TooltipProvider>
    </ThemeProvider>
  </React.StrictMode>,
);

document.addEventListener("DOMContentLoaded", () => {
  const dragRegionDiv = document.createElement("div");
  dragRegionDiv.setAttribute("data-tauri-drag-region", "");
  dragRegionDiv.className = "dragble-state";
  document.documentElement.insertBefore(dragRegionDiv, document.body);
});
