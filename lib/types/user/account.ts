export type Account = {
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
