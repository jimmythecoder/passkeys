import "./Success.scss";
import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { paths } from "@/Routes";
import { usePasskeyApi } from "@/hooks/usePasskeyApi";
import type { User } from "@passkeys/types";

export type SuccessProps = {
    from: "signin" | "register";
};

export const Success: React.FC<React.PropsWithChildren<SuccessProps>> = (props) => {
    const [user, setUser] = useState<User.Account>({ roles: [] } as unknown as User.Account);
    const [session, setSession] = useState<User.Session>({} as User.Session);
    const userData = sessionStorage.getItem("user");
    const sessionData = sessionStorage.getItem("session");
    const navigate = useNavigate();
    const passkeyApi = usePasskeyApi();

    useEffect(() => {
        try {
            if (!userData || !sessionData) {
                throw new Error("No user found");
            }
            setUser(JSON.parse(userData));
            setSession(JSON.parse(sessionData));
        } catch (error) {
            console.error(error);
            navigate(paths.signin);
        }
    }, [userData, sessionData, navigate]);

    const handleSignout = async () => {
        try {
            await passkeyApi.signout();

            sessionStorage.removeItem("user");
            sessionStorage.removeItem("session");

            navigate(paths.signin);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <>
            <header>
                <h1>
                    Hi, <span>{user.displayName}</span>
                </h1>
            </header>
            <main className="success">
                <p className="centered">
                    <svg xmlns="http://www.w3.org/2000/svg" height="96" viewBox="0 -960 960 960" width="96" fill="green">
                        <path d="m423.231-309.847 268.922-268.922L650-620.922 423.231-394.153l-114-114L267.078-466l156.153 156.153Zm56.836 209.846q-78.836 0-148.204-29.92-69.369-29.92-120.682-81.21-51.314-51.291-81.247-120.629-29.933-69.337-29.933-148.173t29.92-148.204q29.92-69.369 81.21-120.682 51.291-51.314 120.629-81.247 69.337-29.933 148.173-29.933t148.204 29.92q69.369 29.92 120.682 81.21 51.314 51.291 81.247 120.629 29.933 69.337 29.933 148.173t-29.92 148.204q-29.92 69.369-81.21 120.682-51.291 51.314-120.629 81.247-69.337 29.933-148.173 29.933ZM480-160q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
                    </svg>
                </p>
                <p className="centered">You have {props.from === "signin" ? "signed in" : "registered"} successfully</p>
                <br />

                <dl className="details">
                    <dt>ID</dt>
                    <dd>{user.id}</dd>
                    <dt>Email</dt>
                    <dd>{user.userName}</dd>
                    <dt>Display name</dt>
                    <dd>{user.displayName}</dd>
                    <dt>Roles</dt>
                    <dd>{user.roles.join(", ")}</dd>
                    <dt>Verified</dt>
                    <dd>{user.isVerified ? "true" : "false"}</dd>
                    <dt>Expires at</dt>
                    <dd>{new Date(session.expiresAt).toLocaleString()}</dd>
                </dl>

                <p>
                    <NavLink to={paths.signin}>
                        <button className="primary block">Continue</button>
                    </NavLink>
                </p>

                <p className="m-t-2 m-b-2">
                    <label className="divider">
                        <span>OR</span>
                    </label>
                </p>

                <p className="centered">
                    <button type="button" onClick={handleSignout} className="secondary small">
                        Sign out
                    </button>
                </p>
            </main>
        </>
    );
};

export default Success;
