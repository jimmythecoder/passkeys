import { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/types";

export type Response = PublicKeyCredentialRequestOptionsJSON;

export type Request = {
    /**
     * The username of the user to sign in. Usually their email address.
     */
    userName: string;
};

export type ConditionalUIRequest = {
    authenticators: string[];
};
