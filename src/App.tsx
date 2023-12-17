import { useState } from "react";
import { fido2Create } from "@ownid/webauthn";
import { fido2Get } from "@ownid/webauthn";
import { encode, decode } from "./base64url";
import "./App.scss";

export const App: React.FC<React.PropsWithChildren> = () => {
    const [token, setToken] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const api = {
        async register(username: string) {
            const publicKey = await fetch("/api/register/start", { headers: {"Content-Type": "application/json"}, method: "POST", body: JSON.stringify({ username }) }).then((res) => res.json());
            const data = await fido2Create(publicKey, username);

            return fetch("/api/register/finish", { headers: {"Content-Type": "application/json"}, method: "POST", body: JSON.stringify(data) }).then((res) => res.json());
        },

        async login(username: string) {
            const publicKey = await fetch("/api/login/start", { headers: {"Content-Type": "application/json"}, method: "POST", body: JSON.stringify({ username }) }).then((res) => res.json());
            const data = await fido2Get(publicKey, username);

            return fetch("/api/login/finish", {headers: {"Content-Type": "application/json"}, method: "POST", body: JSON.stringify(data) }).then((res) => res.json());
        },
    };

    const create = async (user, challenge) => {
        return navigator.credentials
            .create({
                publicKey: {
                    rp: {
                        name: "Todos",
                    },
                    user: {
                        id: decode(user.id),
                        name: user.name,
                        displayName: user.displayName,
                    },
                    challenge: decode(challenge),
                    pubKeyCredParams: [
                        {
                            type: "public-key",
                            alg: -7, // ES256
                        },
                        {
                            type: "public-key",
                            alg: -257, // RS256
                        },
                    ],
                    //attestation: 'none',
                    authenticatorSelection: {
                        //authenticatorAttachment: 'platform', // "platform" | "cross-platform"
                        //residentKey: 'discouraged', // "discouraged" | "preferred" | "required"
                        //requireResidentKey: false, // true | false (default)
                        userVerification: "preferred", // "required" | "preferred" (default) | "discouraged"
                    },
                    //extensions: {
                    //  credProps: true
                    //}
                },
            })
            .then(function (credential) {
                const body = {
                    response: {
                        clientDataJSON: encode(credential.response.clientDataJSON),
                        attestationObject: encode(credential.response.attestationObject),
                    },
                };
                if (credential.response.getTransports) {
                    body.response.transports = credential.response.getTransports();
                }
            });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const username = (e.currentTarget.elements.namedItem("username") as HTMLInputElement).value;
            const data = await api.register(username);
            console.debug("Successfully created using webAuthn", data);

            create(data.user, data.challenge);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
                console.error(err);
            }
        }
        setLoading(false);
    };

    return (
        <div className="container">
            <header>
                <h1>Sign in with a passkey</h1>
            </header>
            <main>
                <form onSubmit={handleSubmit} name="login">
                    <div className="element">
                        <label htmlFor="username">Email address</label>
                        <input type="email" name="username" id="username" autoComplete="email" placeholder="example@domain.com" required />
                        <p className="error">Your email is not valid</p>
                    </div>
                    <div className="element">
                        <label htmlFor="password">Password</label>
                        <input type="password" id="password" name="password" autoComplete="current-password" placeholder="Current password" required />
                        <p className="error">Your password is not valid</p>
                    </div>

                    <div className="element">
                        <button type="submit">Sign in</button>
                    </div>

                    <div className="element signup">
                        <p>Don&rsquo;t have an account yet? <a href="/signup">Sign up</a>.</p>
                    </div>
                     
                </form>
            </main>

            <footer></footer>
        </div>
    );
};

export default App;
