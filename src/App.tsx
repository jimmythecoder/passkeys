import { Outlet } from "react-router-dom";
import "./App.scss";

export const App: React.FC<React.PropsWithChildren> = () => {
    return (
        <div className="container">
            <Outlet />
        </div>
    );
};

export default App;
