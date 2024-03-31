import { User } from "../../../index";
import { RegistrationResponseJSON } from "@simplewebauthn/types";

export type Request = RegistrationResponseJSON;

export type Response = {
    /**
     * User object that signed in
     */
    user: User.Account;

    /**
     * Session details including expiry
     */
    session: User.Session;

    /**
     * Base64 Encoded Uint8Array Authenticator credential ID
     */
    credentialID: string;
};
