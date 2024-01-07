import { useEffect, useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { post } from "@/utils/api";
import { ENDPOINTS } from "@/config";
import { startAuthentication, browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { paths } from "@/Routes";
import "./Login.scss";
import type { Auth } from "@/types/api";

enum FormInputs {
    username = "email",
}

export const Login: React.FC<React.PropsWithChildren> = () => {
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const useConditionalUI = true;

    const api = {
        /**
         * Sign in a user
         * @param username Users email address
         * @returns Promise<boolean> True if the user was signed in successfully
         */
        async signin(username: string) {
            setLoading(true);
            setError("");

            try {
                const authenticationOptions = await post<Auth.Signin.GetCredentials.Response, Auth.Signin.GetCredentials.Request>(ENDPOINTS.auth.signin.getCredentials, { username });

                // Pass the options to the authenticator and wait for a response
                const attResp = await startAuthentication(authenticationOptions);
                const response = await post<Auth.Signin.Verify.Response, Auth.Signin.Verify.Request>(ENDPOINTS.auth.signin.verify, attResp);

                sessionStorage.setItem("user", JSON.stringify(response.user));
                sessionStorage.setItem("session", JSON.stringify(response.session));

                // Save Authenticator ID so we can use Conditional UI on next login
                localStorage.setItem("authenticators", JSON.stringify([attResp.rawId]));

                console.debug("Login success");
                return true;
            } catch (error) {
                if (error instanceof Error) {
                    if (error.name === "InvalidStateError") {
                        console.error("Error: Authenticator was probably already registered by user", error.message);
                    } else {
                        console.error(error);
                    }

                    setError(error.message);
                } else {
                    setError("Unknown server error");
                    console.error(error);
                }
            }

            return false;
        },
    };

    useEffect(() => {
        if (!browserSupportsWebAuthn()) {
            setError("WebAuthn is not supported in this browser");
        }

        const abortController = new AbortController();

        if (useConditionalUI) {
            const authenticators = JSON.parse(localStorage.getItem("authenticators") ?? "[]") as string[];

            if (authenticators && authenticators.length) {
                post<Auth.Signin.GetCredentials.Response, Auth.Signin.GetCredentials.ConditionalUIRequest>(ENDPOINTS.auth.signin.getAllCredentails, { authenticators }, abortController.signal).then((options) => {
                    return startAuthentication(options, true).then((attResp) => {
                        return post<Auth.Signin.Verify.Response, Auth.Signin.Verify.Request>(ENDPOINTS.auth.signin.verify, attResp, abortController.signal);
                    });
                }).then((response) => {
                    sessionStorage.setItem("user", JSON.stringify(response.user));
                    sessionStorage.setItem("session", JSON.stringify(response.session));
                    navigate(paths.signinSuccess);
                }).catch((err) => {
                    if (err instanceof DOMException && err.name === "AbortError") {
                        return;
                    }

                    if (err instanceof Error) {
                        setError(err.message);
                    }

                    console.error(err);
                });
            }
        }

        return () => {
            abortController.abort();
        };
    }, [navigate, useConditionalUI]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const username = (e.currentTarget.elements.namedItem(FormInputs.username) as HTMLInputElement).value;
            const success = await api.signin(username);
            console.debug("Login response", success);

            if (success) {
                navigate(paths.signinSuccess);
            }
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
                console.error(err);
            }
        }

        setLoading(false);
    };

    return (
        <>
            <header>
                <h1>
                    <svg xmlns="http://www.w3.org/2000/svg" height="44" viewBox="0 -960 960 960" width="44" fill="#442983">
                        <path d="M140.001-180.001v-88.922q0-29.384 15.962-54.422 15.961-25.039 42.653-38.5 59.308-29.077 119.654-43.615 60.346-14.539 121.73-14.539 21.058 0 42.116 1.885 21.057 1.885 42.115 5.654-1.692 51.461 20.808 96.807Q567.539-270.307 609-240v59.999H140.001Zm613.845 107.69-53.343-53.138v-164.73q-39.118-11.514-63.849-43.975-24.73-32.461-24.73-74.691 0-51.467 36.38-87.848 36.381-36.382 87.846-36.382t87.657 36.397q36.192 36.397 36.192 87.885 0 39.947-22.423 70.716-22.423 30.769-57.192 44.231l44.23 44.23-53.076 53.192 53.076 53.192-70.768 70.922ZM440-484.615q-57.749 0-98.874-41.124-41.125-41.125-41.125-98.874 0-57.75 41.125-98.874 41.125-41.125 98.874-41.125 57.749 0 98.874 41.125 41.125 41.124 41.125 98.874 0 57.749-41.125 98.874-41.125 41.124-98.874 41.124Zm296.154 93.463q14.692 0 25.038-10.539 10.346-10.538 10.346-25.23t-10.346-25.038q-10.346-10.346-25.038-10.346-14.693 0-25.231 10.346-10.538 10.346-10.538 25.038t10.538 25.23q10.538 10.539 25.231 10.539Z" />
                    </svg>
                    <span>Sign in</span>
                </h1>
            </header>
            <main>
                <form onSubmit={handleSubmit} name="login">
                    {error && (
                        <div className="element form-error">
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="element">
                        <label htmlFor="username">Email address</label>
                        <input type="email" name={FormInputs.username} id={FormInputs.username} autoComplete="username webauthn" placeholder="example@domain.com" required />
                        <p className="error">Your email is not valid</p>
                    </div>

                    <div className="element">
                        <button type="submit" disabled={loading}>
                            Sign in
                        </button>
                    </div>

                    <div className="element signup">
                        <p>
                            Don&rsquo;t have an account yet? <NavLink to={paths.register}>Sign up &#9997;</NavLink>
                        </p>
                    </div>
                </form>
            </main>
        </>
    );
};

export default Login;
