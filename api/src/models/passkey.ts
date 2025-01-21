import type { AuthenticatorTransportFuture, CredentialDeviceType, Base64URLString } from "@simplewebauthn/server";
import dynamoose from "dynamoose";
import { Item } from "dynamoose/dist/Item";

/**
 * It is strongly advised that credentials get their own DB
 * table, ideally with a foreign key somewhere connecting it
 * to a specific UserModel.
 *
 * "SQL" tags below are suggestions for column data types and
 * how best to store data received during registration for use
 * in subsequent authentications.
 */
export type Passkey = {
    // SQL: Store as `TEXT`. Index this column
    id: Base64URLString;
    // SQL: Store raw bytes as `BYTEA`/`BLOB`/etc...
    //      Caution: Node ORM's may map this to a Buffer on retrieval,
    //      convert to Uint8Array as necessary
    publicKey: Uint8Array;
    // SQL: Foreign Key to an instance of your internal user model
    userId: string;
    // SQL: Store as `TEXT`. Index this column. A UNIQUE constraint on
    //      (webAuthnUserID + user) also achieves maximum user privacy
    webauthnUserID: Base64URLString;
    // SQL: Consider `BIGINT` since some authenticators return atomic timestamps as counters
    counter: number;
    // SQL: `VARCHAR(32)` or similar, longest possible value is currently 12 characters
    // Ex: 'singleDevice' | 'multiDevice'
    deviceType: CredentialDeviceType;
    // SQL: `BOOL` or whatever similar type is supported
    backedUp: boolean;
    // SQL: `VARCHAR(255)` and store string array as a CSV string
    // Ex: ['ble' | 'cable' | 'hybrid' | 'internal' | 'nfc' | 'smart-card' | 'usb']
    transports?: AuthenticatorTransportFuture[];
};

export const PasskeySchema = new dynamoose.Schema({
    id: {
        type: String,
    },
    publicKey: {
        type: Buffer,
        hashKey: true,
    },
    userId: {
        type: String,
        index: {
            type: "global",
            name: "userIdIndex",
        },
    },
    webauthnUserID: {
        type: String,
        index: {
            type: "global",
            name: "webauthnUserIDIndex",
        },
    },
    counter: {
        type: Number,
    },
    deviceType: {
        type: String,
    },
    backedUp: {
        type: Boolean,
    },
    transports: {
        type: Array,
    },
});

export const PasskeyModel = dynamoose.model<Item & Passkey>("Passkey", PasskeySchema);
