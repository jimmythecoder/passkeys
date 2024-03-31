import type { User } from "@passkeys/types";

export const UserRoles = {
    /**
     * Admin role, can do anything
     */
    Admin: "admin",

    /**
     * Manager role, can manage users and content
     */
    Manager: "manager",

    /**
     * Editor role, can edit content
     */
    Editor: "editor",

    /**
     * Moderator role, can moderate comments and posts
     */
    Moderator: "moderator",

    /**
     * Marketing role, can manage marketing campaigns
     */
    Marketing: "marketing",

    /**
     * Basic User role, just signed up for authenticated users
     */
    User: "user",

    /**
     * Guest role, for unauthenticated users
     */
    Guest: "guest",
} as const satisfies Record<string, User.Role>;

export const JWT_ALGORITHM = "EdDSA";

/**
 * How long the JWT challenge is valid for in seconds.
 */
export const JWT_CHALLENGE_EXPIRATION = 360;
export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
export const MAX_AUTHENTICATORS = 7;
export const USER_SESSION_EXPIRATION = 360;
export const USER_SESSION_REFRESH = 60;
export const USER_SESSION_REFRESH_EXPIRATION = 360;
export const USER_SESSION_REFRESH_MAX = 7;
export const USER_SESSION_REFRESH_MIN = 1;
export const USER_SESSION_REFRESH_STEP = 1;
