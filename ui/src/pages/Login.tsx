import { useEffect, useState, useMemo } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { startAuthentication, browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { ApiException } from "@passkeys/exceptions";
import { paths } from "@/Routes";
import { usePasskeyApi } from "@/hooks/usePasskeyApi";
import { daysAgo } from "@/utils/browser";
import PasskeyIcon from "@/assets/FIDO_Passkey_mark_A_reverse.png";
import Fingerprint from "@/assets/fingerprint.svg?inline";
import "./Login.scss";

enum FormInputs {
    username = "email",
    rememberMe = "rememberMe",
}

type AuthHistory = {
    authenticatorId: string;
    authenticatorName: string;
    userName: string;
    displayName: string;
    lastLoggedInAt: string;
};

export const Login: React.FC<React.PropsWithChildren> = () => {
    const [error, setError] = useState<Error>();
    const [authenticators, setAuthenticators] = useState<AuthHistory[]>(JSON.parse(localStorage.getItem("authenticators") ?? "[]"));
    const [loading, setLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const navigate = useNavigate();
    const passkeyApi = usePasskeyApi();
    const useConditionalUI = useMemo(() => true, []);

    const api = {
        /**
         * Sign in a user
         * @param username Users email address
         * @returns Promise<boolean> True if the user was signed in successfully
         */
        async signin(userName: string, rememberMe: boolean) {
            setLoading(true);
            setError(undefined);

            try {
                const authenticationOptions = await passkeyApi.getSigninCredentials(userName);

                // Pass the options to the authenticator and wait for a response
                const attResp = await startAuthentication(authenticationOptions);

                const response = await passkeyApi.verifySignin(attResp);

                sessionStorage.setItem("user", JSON.stringify(response.user));
                sessionStorage.setItem("session", JSON.stringify(response.session));

                if (rememberMe) {
                    let updatedAuthenticators = [...authenticators];
                    const existing = authenticators.find((a) => a.authenticatorId === attResp.rawId);
                    if (existing) {
                        updatedAuthenticators = authenticators.map((a) =>
                            a.authenticatorId === attResp.rawId ? { ...a, lastUsedAt: new Date().toISOString() } : a,
                        );
                    } else {
                        updatedAuthenticators.push({
                            authenticatorId: attResp.rawId,
                            authenticatorName: response.authenticator.name,
                            lastLoggedInAt: new Date().toISOString(),
                            userName: response.user.userName,
                            displayName: response.user.displayName,
                        });
                    }

                    localStorage.setItem("authenticators", JSON.stringify(updatedAuthenticators));

                    // Save Authenticator ID so we can use Conditional UI on next login
                    setAuthenticators(updatedAuthenticators);
                }

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
        signinWith(authenticatorId: string) {
            passkeyApi
                .signinWith(authenticatorId)
                .then((authenticationOptions) => {
                    return startAuthentication(authenticationOptions).then((attResp) => {
                        return passkeyApi.verifySignin(attResp);
                    });
                })
                .then((response) => {
                    sessionStorage.setItem("user", JSON.stringify(response.user));
                    sessionStorage.setItem("session", JSON.stringify(response.session));
                    navigate(paths.signinSuccess);
                })
                .catch((err) => {
                    if (err instanceof ApiException) {
                        setError(err);
                    }

                    console.error(err);
                });
        },
    };

    useEffect(() => {
        if (!browserSupportsWebAuthn()) {
            setError(new Error("WebAuthn is not supported in this browser"));
        }

        const abortController = new AbortController();

        if (useConditionalUI) {
            if (authenticators && authenticators.length) {
                console.debug("Conditional UI login", authenticators);
                passkeyApi
                    .conditionalUI(
                        authenticators.map((authenticator) => authenticator.authenticatorId),
                        abortController.signal,
                    )
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
            const rememberMe = (e.currentTarget.elements.namedItem(FormInputs.rememberMe) as HTMLInputElement).checked;
            const success = await api.signin(username, rememberMe);

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
                {authenticators && (
                    <div className="saved-authenticators">
                        <h2>Sign in again as</h2>

                        <ul className="authenticator-list">
                            {authenticators.map((authenticator) => (
                                <li key={authenticator.authenticatorId} className="authenticator">
                                    <div className="left">
                                        <h4 className="displayName">{authenticator.displayName}</h4>
                                        <p className="userName">{authenticator.userName}</p>
                                    </div>
                                    <div className="right">
                                        <p className="authenticatorName">{authenticator.authenticatorName}</p>
                                        <p className="lastLoggedInAt">
                                            Signed in{" "}
                                            {daysAgo(authenticator.lastLoggedInAt) ? `${daysAgo(authenticator.lastLoggedInAt)} days ago` : `today`}
                                        </p>
                                    </div>
                                    <div className="icon">
                                        <button
                                            onClick={() => api.signinWith(authenticator.authenticatorId)}
                                            type="button"
                                            data-id={authenticator.authenticatorId}
                                            className="profile"
                                        >
                                            <img src={Fingerprint} alt="Fingerprint" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
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

                    <div className="element confirmation">
                        <input type="checkbox" name={FormInputs.rememberMe} id={FormInputs.rememberMe} defaultChecked={true} />
                        <label htmlFor={FormInputs.rememberMe}>Remember my details</label>
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
