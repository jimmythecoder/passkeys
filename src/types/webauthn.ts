/**
 * Flags determine multiple pieces of information.
 * @see https://www.w3.org/TR/webauthn/#authenticator-data 
 */
export type AttestationFlags = {

    /**
     * User Present (UP) result.
     * 1 means the user is present.
     * 0 means the user is not present.
     */
    bit0: boolean;

    /**
     * Reserved for future use (RFU1).
     */
    bit1: boolean;

    /**
     * User Verified (UV) result. 
     * 1 means the user is verified. 
     * 0 means the user is not verified.
     */
    bit2: boolean;

    /**
     * Reserved for future use (RFU2).
     */
    bit3: boolean;

    /**
     * Reserved for future use (RFU2).
     */
    bit4: boolean;

    /**
     * Reserved for future use (RFU2).
     */
    bit5: boolean;

    /**
     * Attested credential data included (AT). 
     * Indicates whether the authenticator added attested credential data.
     */
    bit6: boolean;

    /**
     * Extension data included (ED).
     * Indicates if the authenticator data has extensions.
     */
    bit7: boolean;
};

export type AuthData = {
    /**
     * This is the SHA-256 hash of the origin, e.g., my.passkeys.com.
     * @length 32 bytes
     */
    rpIdHash: string;

    /**
     * Flags determine multiple pieces of information.
     * @see https://www.w3.org/TR/webauthn/#authenticator-data 
     * @length 1 byte
     */
    flags: AttestationFlags;

    /**
     * This should always be 0000 for passkeys.
     * @length 4 bytes
     */
    signCount: number;

    /**
     * This will contain credential data if it’s available in a COSE key format.
     */
    attestedCredentialData: string;

    /**
     * These are any optional extensions for authentication.
     */
    extensions: string;
};

export type JwtPayload = {
    /**
     * Issued at time as a unix timestamp
     */
    iat: number;

    /**
     * Expires at time as a unix timestamp
     */
    exp: number;
    id: string;
    userName: string;
    displayName: string;
    roles: string[];
    isVerified?: boolean;
};
