import { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/typescript-types";

export type Response = PublicKeyCredentialRequestOptionsJSON;

export type Request = {
    /**
     * The username of the user to sign in. Usually their email address.
     */
    username: string;
}

export type ConditionalUIRequest = {
    authenticators: string[];
}