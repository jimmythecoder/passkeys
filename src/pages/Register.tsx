import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { post, endpoints } from "@/utils/api";
import { startRegistration, browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { paths } from "@/Routes";
import "./Register.scss";

export const Register: React.FC<React.PropsWithChildren> = () => {
    const isWebAuthnSupported = browserSupportsWebAuthn();
    const [error, setError] = useState(isWebAuthnSupported ? "" : "WebAuthn is not supported in this browser");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const api = {
        async register(displayName: string, username: string) {
            setLoading(true);
            setError("");

            try {
                const registrationOptions = await post(endpoints.auth.register.getCredentials, { displayName, username });

                // Pass the options to the authenticator and wait for a response
                const attResp = await startRegistration(registrationOptions);

                const response = await post(endpoints.auth.register.verify, attResp);

                sessionStorage.setItem("auth_token", response.token);

                console.debug("User registered");
                return true;
            } catch (error) {
                if (error instanceof Error) {
                    if (error.name === "InvalidStateError") {
                        console.error("Error: Authenticator was probably already registered by user", error.message);
                    } else {
                        console.error(error.message);
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

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const formData = new FormData(e.currentTarget);
            const displayName = formData.get("displayName") as string;
            const username = formData.get("username") as string;

            const success = await api.register(displayName, username);

            if (success) {
                console.debug("User registered");

                navigate(paths.registerSuccess);
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
                    <span>Sign up</span>
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
                        <label htmlFor="displayName">Name</label>
                        <input type="text" name="displayName" id="displayName" autoFocus autoComplete="given-name" placeholder="John Doe" required />
                        <p className="error">Your name is required</p>
                    </div>

                    <div className="element">
                        <label htmlFor="username">Email address</label>
                        <input type="email" name="username" id="username" autoComplete="email" placeholder="example@domain.com" required />
                        <p className="error">Your email is not valid</p>
                    </div>

                    <div className="element">
                        <button disabled={loading} type="submit">
                            Sign up
                        </button>
                    </div>

                    <div className="element signup">
                        <p>
                            Already have an account? <NavLink to={paths.signin}>Sign in</NavLink>
                        </p>
                    </div>
                </form>
            </main>
        </>
    );
};

export default Register;
