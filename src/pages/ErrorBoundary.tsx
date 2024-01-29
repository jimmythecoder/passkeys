import { useRouteError, NavLink } from "react-router-dom";
import { useEffect } from "react";
import { paths } from "@/Routes";

export const ErrorBoundary: React.FC<React.PropsWithChildren> = () => {
    const error = useRouteError() as Error;

    useEffect(() => {
        if (error) {
            console.error("App error", error);
        }

        const errorHandler = (event: ErrorEvent) => {
            console.error("System error", event.error.stack);
        };
        window.addEventListener("error", errorHandler);

        return () => {
            window.removeEventListener("error", errorHandler);
        };
    }, [error]);

    return (
        <>
            <header>
                <h1>
                    Ouch! <span>😵</span>
                </h1>
            </header>
            <main>
                <p>Something went wrong...</p>

                <pre className="alert error">{error?.message}</pre>

                <div className="m-t-2 m-b-2">
                    <hr />
                </div>

                <p>
                    <NavLink to={paths.signin}>Back to home</NavLink>
                </p>
            </main>
        </>
    );
};

export default ErrorBoundary;
