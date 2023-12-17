import { App } from "./App";
import { Register } from "@/pages/Register.tsx";
import { Login } from "@/pages/Login.tsx";
import { Success } from "@/pages/Success.tsx";
import { Route, createBrowserRouter, createRoutesFromElements } from "react-router-dom";

const routes = createBrowserRouter(createRoutesFromElements(
    <Route element={<App />}>
        <Route index path="/" element={<Login />} />
        <Route path="signup" element={<Register />} />
        <Route path="success" element={<Success />} />
    </Route>
));

export default routes;
