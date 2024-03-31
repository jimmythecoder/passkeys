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
