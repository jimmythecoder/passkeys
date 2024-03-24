import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Monitoring } from "@/contexts";
import { routes } from "./Routes.tsx";

window.addEventListener("error", (event) => {
    console.error("System error", event.error.stack);
    gtag("event", "exception", {
        description: event.error.stack,
        fatal: true,
    });
});

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <Monitoring.MonitoringProvider>
            <RouterProvider router={routes} />
        </Monitoring.MonitoringProvider>
    </React.StrictMode>,
);
