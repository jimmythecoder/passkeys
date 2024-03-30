import { useRouteError, NavLink } from "react-router-dom";
import { useEffect } from "react";
import { paths } from "@/Routes";
import { MonitoringContext } from "@/contexts/Monitoring";
import { useContext } from "react";

export const ErrorBoundary: React.FC<React.PropsWithChildren> = () => {
    const error = useRouteError() as Error;
    const monitoring = useContext(MonitoringContext);

    useEffect(() => {
        if (error) {
            console.error("App error", error);
            monitoring.awsRum?.recordError(error);
        }

        const errorHandler = (event: ErrorEvent) => {
            console.error("System error", event.error.stack);
            monitoring.awsRum?.recordError(error);
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
