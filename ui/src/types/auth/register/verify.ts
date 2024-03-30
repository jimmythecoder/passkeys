import { User, UserSession } from "@/types/user";
import { RegistrationResponseJSON } from "@simplewebauthn/types";

export type Request = RegistrationResponseJSON;

export type Response = {
    /**
     * User object that signed in
     */
    user: User;

    /**
     * Session details including expiry
     */
    session: UserSession;

    /**
     * Base64 Encoded Uint8Array Authenticator credential ID
     */
    credentialID: string;
};
