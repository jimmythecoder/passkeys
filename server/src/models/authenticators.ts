import dynamoose from "dynamoose";
import { Item } from "dynamoose/dist/Item.js";

/**
 * It is strongly advised that authenticators get their own DB
 * table, ideally with a foreign key to a specific UserModel.
 *
 * "SQL" tags below are suggestions for column data types and
 * how best to store data received during registration for use
 * in subsequent authentications.
 */
export type RegisteredAuthenticator = {
    id: string;

    userId: string;

    // SQL: Encode to base64url then store as `TEXT`. Index this column
    credentialID: Uint8Array;
    // SQL: Store raw bytes as `BYTEA`/`BLOB`/etc...
    credentialPublicKey: Uint8Array;
    // SQL: Consider `BIGINT` since some authenticators return atomic timestamps as counters
    counter: number;
    // SQL: `VARCHAR(32)` or similar, longest possible value is currently 12 characters
    // Ex: 'singleDevice' | 'multiDevice'
    credentialDeviceType: CredentialDeviceType;
    // SQL: `BOOL` or whatever similar type is supported
    credentialBackedUp: boolean;
    // SQL: `VARCHAR(255)` and store string array as a CSV string
    // Ex: ['usb' | 'ble' | 'nfc' | 'internal']
    transports?: AuthenticatorTransport[];
};

export type CredentialDeviceType = "singleDevice" | "multiDevice";

export type AuthenticatorModelType = Item & RegisteredAuthenticator;

export class Authenticator implements RegisteredAuthenticator {
    public readonly id: string;

    public readonly userId: string;

    // SQL: Encode to base64url then store as `TEXT`. Index this column
    public readonly credentialID: Uint8Array;

    // SQL: Store raw bytes as `BYTEA`/`BLOB`/etc...
    public readonly credentialPublicKey: Uint8Array;

    // SQL: Consider `BIGINT` since some authenticators return atomic timestamps as counters
    public readonly counter: number;

    // SQL: `VARCHAR(32)` or similar, longest possible value is currently 12 characters
    // Ex: 'singleDevice' | 'multiDevice'
    public readonly credentialDeviceType: CredentialDeviceType;

    // SQL: `BOOL` or whatever similar type is supported
    public readonly credentialBackedUp: boolean;

    // SQL: `VARCHAR(255)` and store string array as a CSV string
    // Ex: ['usb' | 'ble' | 'nfc' | 'internal']
    transports?: AuthenticatorTransport[];

    constructor(registeredAuthenticator: RegisteredAuthenticator) {
        this.id = registeredAuthenticator.id;
        this.userId = registeredAuthenticator.userId;
        this.credentialID = registeredAuthenticator.credentialID;
        this.credentialPublicKey = registeredAuthenticator.credentialPublicKey;
        this.counter = registeredAuthenticator.counter;
        this.credentialDeviceType = registeredAuthenticator.credentialDeviceType;
        this.credentialBackedUp = registeredAuthenticator.credentialBackedUp;
        this.transports = registeredAuthenticator.transports;
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
