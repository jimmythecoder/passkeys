export type CredentialDeviceType = "singleDevice" | "multiDevice";

/**
 * It is strongly advised that authenticators get their own DB
 * table, ideally with a foreign key to a specific UserModel.
 *
 * "SQL" tags below are suggestions for column data types and
 * how best to store data received during registration for use
 * in subsequent authentications.
 */
export type RegisteredAuthenticator = {
    /**
     * Unique ID for the authenticator
     */
    id: string;

    /**
     * Foreign key to the UserModel
     */
    userId: string;

    /**
     * A human-readable name for the authenticator. e.g. "iPhone 15 Pro Max"
     * @default Name based on the UserAgent string
     */
    name: string;

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
