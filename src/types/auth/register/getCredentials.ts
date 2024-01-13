import { PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/typescript-types";

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
}
