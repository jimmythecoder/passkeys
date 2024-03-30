import { User, UserSession } from "@/types/user";
import { AuthenticationResponseJSON } from "@simplewebauthn/types";

export type Request = AuthenticationResponseJSON;

export type Response = {
    /**
     * User object that signed in
     */
    user: User;

    /**
     * Session details including expiry
     */
    session: UserSession;
};
