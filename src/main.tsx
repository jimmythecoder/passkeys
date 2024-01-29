import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
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
        <RouterProvider router={routes} />
    </React.StrictMode>,
);
