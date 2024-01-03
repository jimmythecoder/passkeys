import { App } from "./App";
import { Register } from "@/pages/Register.tsx";
import { Login } from "@/pages/Login.tsx";
import { Success } from "@/pages/Success.tsx";
import { ErrorBoundary } from "@/pages/ErrorBoundary.tsx";
import { Route, createBrowserRouter, createRoutesFromElements } from "react-router-dom";

const routes = createBrowserRouter(createRoutesFromElements(
    <Route element={<App />}>
        <Route errorElement={<ErrorBoundary />}>
            <Route index path="/" element={<Login />} />
            <Route path="signup" element={<Register />} />
            <Route path="/signin/success" element={<Success from="signin" />} />
            <Route path="/register/success" element={<Success from="register" />} />
        </Route>
    </Route>
));

export default routes;
