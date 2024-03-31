export type Role = "admin" | "manager" | "editor" | "moderator" | "marketing" | "user" | "guest";

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
    roles: Role[];

    /**
     * Is email verified?
     */
    isVerified?: boolean;

    failedLoginAttempts: number;

    isLocked: boolean;
};
