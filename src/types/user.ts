export type User = {
    /**
     * User's unique ID as GUID
     */
    id: string;

    /**
     * User's username, usually an email address
     */
    userName: string;

    /**
     * User's display name, their full name for example
     */
    displayName: string;

    /**
     * Roles the user has ("basic", "admin")
     */
    roles: string[];

    /**
     * Is email verified?
     */
    isVerified?: boolean;
};

export type UserSession = {
    /**
     * User ID above
     */
    userId: string;

    /**
     * When the session was issued as a Unix timestamp
     */
    issuedAt: number;

    /**
     * When the session will expire as a Unix timestamp
     */
    expiresAt: number;
};