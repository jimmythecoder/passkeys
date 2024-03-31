import { User } from "../../../index";
import { AuthenticationResponseJSON } from "@simplewebauthn/types";

export type Request = AuthenticationResponseJSON;

export type Response = {
    /**
     * User object that signed in
     */
    user: User.Account;

    /**
     * Session details including expiry
     */
    session: User.Session;
};
