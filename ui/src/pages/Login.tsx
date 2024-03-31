import { useEffect, useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { startAuthentication, browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { ApiException } from "@passkeys/exceptions";
import { paths } from "@/Routes";
import { usePasskeyApi } from "@/hooks/usePasskeyApi";
import PasskeyIcon from "@/assets/FIDO_Passkey_mark_A_reverse.png";
import "./Login.scss";

enum FormInputs {
    username = "email",
}

export const Login: React.FC<React.PropsWithChildren> = () => {
    const [error, setError] = useState<Error>();
    const [loading, setLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const navigate = useNavigate();
    const passkeyApi = usePasskeyApi();
    const useConditionalUI = true;

    const api = {
        /**
         * Sign in a user
         * @param username Users email address
         * @returns Promise<boolean> True if the user was signed in successfully
         */
        async signin(userName: string) {
            setLoading(true);
            setError(undefined);

            try {
                const authenticationOptions = await passkeyApi.getSigninCredentials(userName);

                // Pass the options to the authenticator and wait for a response
                const attResp = await startAuthentication(authenticationOptions);
                const response = await passkeyApi.verifySignin(attResp);

                sessionStorage.setItem("user", JSON.stringify(response.user));
                sessionStorage.setItem("session", JSON.stringify(response.session));

                // Save Authenticator ID so we can use Conditional UI on next login
                localStorage.setItem("authenticators", JSON.stringify([attResp.rawId]));

                console.debug("Login success");
                return true;
            } catch (apiError) {
                if (apiError instanceof ApiException) {
                    setError(apiError);
                } else {
                    setError(new Error("An unknown error occurred"));
                    console.error(apiError);
                }
            }

            return false;
        },
    };

    useEffect(() => {
        if (!browserSupportsWebAuthn()) {
            setError(new Error("WebAuthn is not supported in this browser"));
        }

        const abortController = new AbortController();

        if (useConditionalUI) {
            const authenticators = JSON.parse(localStorage.getItem("authenticators") ?? "[]") as string[];

            if (authenticators && authenticators.length) {
                console.debug("Conditional UI login", authenticators);
                passkeyApi
                    .conditionalUI(authenticators, abortController.signal)
                    .then((options) => {
                        return startAuthentication(options, true).then((attResp) => {
                            return passkeyApi.verifySignin(attResp, abortController.signal);
                        });
                    })
                    .then((response) => {
                        sessionStorage.setItem("user", JSON.stringify(response.user));
                        sessionStorage.setItem("session", JSON.stringify(response.session));
                        console.debug("Conditional UI login success");
                        navigate(paths.signinSuccess);
                    })
                    .catch((err) => {
                        if (err instanceof DOMException && err.name === "AbortError") {
                            return;
                        }

                        if (err instanceof ApiException) {
                            setError(err);
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
        setError(undefined);
        setIsSubmitted(true);

        try {
            if (!e.currentTarget.checkValidity()) {
                const firstInvalid = e.currentTarget.querySelector(":invalid") as HTMLElement;
                firstInvalid.focus();
                throw new Error("Please check you have entered all fields correctly");
            }

            const username = (e.currentTarget.elements.namedItem(FormInputs.username) as HTMLInputElement).value;
            const success = await api.signin(username);
            console.debug("Login response", success);

            if (success) {
                navigate(paths.signinSuccess);
            }
        } catch (err) {
            if (err instanceof ApiException) {
                setError(err);
                console.error(err);
            }
        }

        setLoading(false);
    };

    return (
        <>
            <header>
                <h1>
                    <span>Passkey demo</span>
                </h1>
            </header>
            <main>
                <form onSubmit={handleSubmit} noValidate name="login" data-submitted={isSubmitted}>
                    {error && (
                        <div className="element form-error">
                            <p>{error.message}</p>
                        </div>
                    )}

                    <div className="element">
                        <label htmlFor={FormInputs.username}>Email address</label>
                        <input
                            type="email"
                            name={FormInputs.username}
                            id={FormInputs.username}
                            autoComplete="username webauthn"
                            placeholder="example@domain.com"
                            required
                        />
                        <p className="error">Your email is not valid</p>
                    </div>

                    <div className="element">
                        <button className="signin" type="submit" disabled={loading}>
                            <img width="32" height="32" className="passkey-icon" src={PasskeyIcon} /> Sign in with a passkey
                        </button>
                    </div>

                    <div className="element signup">
                        <p>
                            Don&rsquo;t have an account yet? <NavLink to={paths.register}>Create account</NavLink>
                        </p>
                    </div>
                </form>
            </main>
        </>
    );
};

export default Login;
