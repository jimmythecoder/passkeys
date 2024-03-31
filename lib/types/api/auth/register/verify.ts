import type { Account, Session } from "../../../user";
import { RegistrationResponseJSON } from "@simplewebauthn/types";

export type Request = RegistrationResponseJSON;

export type Response = {
    /**
     * User object that signed in
     */
    user: Account;

    /**
     * Session details including expiry
     */
    session: Session;

    /**
     * Base64 Encoded Uint8Array Authenticator credential ID
     */
    credentialID: string;
};
