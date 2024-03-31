import dynamoose from "dynamoose";
import { Item } from "dynamoose/dist/Item";
import type { User } from "@passkeys/types";

export type AuthenticatorModelType = Item & User.Webauthn.RegisteredAuthenticator;

export class Authenticator implements User.Webauthn.RegisteredAuthenticator {
    public readonly id: string;

    public readonly userId: string;

    public readonly name: string;

    // SQL: Encode to base64url then store as `TEXT`. Index this column
    public readonly credentialID: Uint8Array;

    // SQL: Store raw bytes as `BYTEA`/`BLOB`/etc...
    public readonly credentialPublicKey: Uint8Array;

    // SQL: Consider `BIGINT` since some authenticators return atomic timestamps as counters
    public readonly counter: number;

    // SQL: `VARCHAR(32)` or similar, longest possible value is currently 12 characters
    // Ex: 'singleDevice' | 'multiDevice'
    public readonly credentialDeviceType: User.Webauthn.CredentialDeviceType;

    // SQL: `BOOL` or whatever similar type is supported
    public readonly credentialBackedUp: boolean;

    // SQL: `VARCHAR(255)` and store string array as a CSV string
    // Ex: ['usb' | 'ble' | 'nfc' | 'internal']
    transports?: AuthenticatorTransport[];

    constructor(registeredAuthenticator: User.Webauthn.RegisteredAuthenticator) {
        this.id = registeredAuthenticator.id;
        this.userId = registeredAuthenticator.userId;
        this.credentialID = registeredAuthenticator.credentialID;
        this.credentialPublicKey = registeredAuthenticator.credentialPublicKey;
        this.counter = registeredAuthenticator.counter;
        this.credentialDeviceType = registeredAuthenticator.credentialDeviceType;
        this.credentialBackedUp = registeredAuthenticator.credentialBackedUp;
        this.transports = registeredAuthenticator.transports;
        this.name = registeredAuthenticator.name;
    }
}

export const UserAuthenticatorSchema = new dynamoose.Schema({
    id: {
        type: String,
    },
    userId: {
        type: String,
        index: {
            type: "global",
            name: "userIdIndex",
        },
    },
    name: {
        type: String,
    },
    createdAt: {
        type: String,
        default: Date.now,
    },
    credentialID: {
        type: Buffer,
        hashKey: true,
    },
    credentialPublicKey: {
        type: Buffer,
    },
    counter: {
        type: Number,
    },
    credentialDeviceType: {
        type: String,
    },
    credentialBackedUp: {
        type: Boolean,
    },
    transports: {
        type: Array,
    },
});

export const AuthenticatorModel = dynamoose.model<AuthenticatorModelType>("UserAuthenticator", UserAuthenticatorSchema);
