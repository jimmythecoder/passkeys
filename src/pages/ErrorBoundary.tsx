import { useRouteError, NavLink } from "react-router-dom";
import { paths } from "@/Routes";

export const ErrorBoundary: React.FC<React.PropsWithChildren> = () => {
    const error = useRouteError() as Error;

    return (
        <>
            <header>
                <h1>
                    Ouch! <span>😵</span>
                </h1>
            </header>
            <main>
                <p>Something went wrong...</p>

                <pre className="alert error">
                    {error?.message}
                </pre>

                <p className="m-t-2 m-b-2">
                    <hr />
                </p>

                <p>
                    <NavLink to={paths.signin}>Back to home</NavLink>
                </p>
            </main>
        </>
    );
};

export default ErrorBoundary;
