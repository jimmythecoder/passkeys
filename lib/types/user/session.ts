export type Session = {
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
