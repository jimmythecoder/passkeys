import type { User } from "../../../index";
import type { RegistrationResponseJSON } from "@simplewebauthn/types";

export type Request = {
    attResp: RegistrationResponseJSON;

    authenticatorName: string;
};

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
