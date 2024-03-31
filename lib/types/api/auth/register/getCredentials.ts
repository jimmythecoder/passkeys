import type { PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/types";

export type Response = PublicKeyCredentialCreationOptionsJSON;

export type Request = {
    /**
     * The username of the user to sign in. Usually their email address.
     */
    userName: string;

    /**
     * The display name of the user to sign in.
     */
    displayName: string;

    /**
     * The name of the authenticator to register.
     */
    authenticatorName: string;
};
