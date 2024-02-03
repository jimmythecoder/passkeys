import { useEffect, useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { startRegistration, browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { post } from "@/utils/api";
import { ENDPOINTS } from "@/config";
import { paths } from "@/Routes";
import PasskeyIcon from "@/assets/FIDO_Passkey_mark_A_reverse.png";
import "./Register.scss";
import type { Auth } from "@/types/api";
import { Exception } from "@/exceptions";

enum FormInputs {
    displayName = "displayName",
    username = "email",
}

export const Register: React.FC<React.PropsWithChildren> = () => {
    const [errorMsg, setErrorMsg] = useState<Exception>();
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const api = {
        /**
         * Register a new user
         * @param displayName Users display name / full name
         * @param username Email address of the user
         * @returns Promise<boolean> True if the user was registered successfully
         */
        async register(displayName: string, userName: string) {
            setLoading(true);
            setErrorMsg(undefined);

            try {
                const registrationOptions = await post<Auth.Register.GetCredentials.Response, Auth.Register.GetCredentials.Request>(
                    ENDPOINTS.auth.register.getCredentials,
                    { displayName, userName },
                );

                performance.mark("startRegister");

                // Pass the options to the authenticator and wait for a response
                const attResp = await startRegistration(registrationOptions);

                performance.mark("endRegister");
                performance.measure("register", "startRegister", "endRegister");

                window.gtag("event", "register", {
                    event_category: "webauthn",
                    event_label: "register",
                    value: performance.getEntriesByName("register")[0].duration,
                });

                const response = await post<Auth.Register.Verify.Response, Auth.Register.Verify.Request>(ENDPOINTS.auth.register.verify, attResp);

                sessionStorage.setItem("user", JSON.stringify(response.user));
                sessionStorage.setItem("session", JSON.stringify(response.session));
                localStorage.setItem("authenticators", JSON.stringify([attResp.rawId]));

                console.debug("User registered");
                return true;
            } catch (apiError) {
                if (apiError instanceof Exception) {
                    setErrorMsg(apiError);
                    console.error(apiError);
                } else {
                    setErrorMsg(new Exception(apiError as Error));
                    console.error(apiError);
                }
            }

            return false;
        },
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(undefined);
        setIsSubmitted(true);

        try {
            if (!e.currentTarget.checkValidity()) {
                const firstInvalid = e.currentTarget.querySelector(":invalid") as HTMLElement;
                firstInvalid.focus();
                throw new Exception({ message: "Please check you have entered all fields correctly" });
            }

            const formData = new FormData(e.currentTarget);
            const displayName = formData.get(FormInputs.displayName) as string;
            const email = formData.get(FormInputs.username) as string;

            const success = await api.register(displayName, email);

            if (success) {
                console.debug("User registered");

                navigate(paths.registerSuccess);
            }
        } catch (err) {
            if (err instanceof Exception) {
                setErrorMsg(err);
                console.error(err);
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        if (!browserSupportsWebAuthn()) {
            setErrorMsg(new Exception({ message: "WebAuthn is not supported in this browser" }));
        }
    }, []);

    return (
        <>
            <header>
                <h1>
                    <span>Create account</span>
                </h1>
            </header>
            <main>
                <form onSubmit={handleSubmit} noValidate name="login" data-submitted={isSubmitted}>
                    {errorMsg && (
                        <div className="element form-error">
                            <p>{errorMsg.message}</p>
                        </div>
                    )}

                    <div className="element">
                        <label htmlFor={FormInputs.displayName}>Your name</label>
                        <input
                            type="text"
                            name={FormInputs.displayName}
                            id={FormInputs.displayName}
                            autoFocus
                            autoComplete="name"
                            placeholder="Full name or username"
                            required
                        />
                        <p className="error">Your name is required</p>
                    </div>

                    <div className="element">
                        <label htmlFor={FormInputs.username}>Email address</label>
                        <input
                            type="email"
                            name={FormInputs.username}
                            id={FormInputs.username}
                            autoComplete="email"
                            placeholder="example@domain.com"
                            required
                        />
                        <p className="error">Your email is not valid</p>
                    </div>

                    <div className="element">
                        <button disabled={loading} type="submit">
                            <img width="32" height="32" className="passkey-icon" src={PasskeyIcon} /> Sign up with a passkey
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
