import { App } from "./App";
import { Register } from "@/pages/Register.tsx";
import { Login } from "@/pages/Login.tsx";
import { Success } from "@/pages/Success.tsx";
import { ErrorBoundary } from "@/pages/ErrorBoundary.tsx";
import { Route, createBrowserRouter, createRoutesFromElements } from "react-router-dom";

export const paths = {
    signin: "/",
    register: "/register",
    signinSuccess: "/signin/success",
    registerSuccess: "/register/success",
};

export const routes = createBrowserRouter(createRoutesFromElements(
    <Route element={<App />}>
        <Route errorElement={<ErrorBoundary />}>
            <Route index path={paths.signin} element={<Login />} />
            <Route path={paths.register} element={<Register />} />
            <Route path={paths.signinSuccess} element={<Success from="signin" />} />
            <Route path={paths.registerSuccess} element={<Success from="register" />} />
        </Route>
    </Route>
));

export default routes;
