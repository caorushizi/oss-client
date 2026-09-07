import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SWRConfig } from "swr";
import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { App } from "./app/App";
import { Toaster } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { FloatWindow } from "./features/float-window/FloatWindow";
import { apiRequest } from "./lib/backend/client";
import "./styles.css";

const isFloatWindow = isTauri() && getCurrentWindow().label === "float";
document.documentElement.classList.add("dark");
document.documentElement.classList.toggle("is-float-window", isFloatWindow);
document.documentElement.classList.toggle(
  "is-main-window",
  isTauri() && !isFloatWindow,
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SWRConfig
      value={{
        fetcher: apiRequest,
        revalidateOnFocus: false,
        shouldRetryOnError: false,
      }}
    >
      <TooltipProvider delayDuration={400}>
        {isFloatWindow ? (
          <FloatWindow />
        ) : (
          <>
            <App />
            <Toaster position="bottom-right" />
          </>
        )}
      </TooltipProvider>
    </SWRConfig>
  </StrictMode>,
);
