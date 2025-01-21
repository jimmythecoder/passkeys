import dynamoose from "dynamoose";
import { Item } from "dynamoose/dist/Item";

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

    createdAt?: Date;
};

export class User implements Account {
    public readonly id: string;

    public readonly userName: string;

    public readonly displayName: string;

    public readonly roles: Role[];

    public isVerified?: boolean;

    public failedLoginAttempts: number;

    public createdAt?: Date;

    constructor(user: Partial<Account> = {}) {
        this.id = user.id ?? crypto.randomUUID();
        this.userName = user.userName ?? this.id;
        this.displayName = user.displayName ?? "Anonymous";
        this.isVerified = user.isVerified ?? false;
        this.roles = user.roles ?? ["guest"];
        this.failedLoginAttempts = user.failedLoginAttempts ?? 0;
        this.createdAt = user.createdAt ?? new Date();
    }

    /**
     * Whether the user is locked out.
     */
    get isLocked() {
        return this.failedLoginAttempts >= 5;
    }
}

export const UserSchema = new dynamoose.Schema({
    id: {
        type: String,
        hashKey: true,
    },
    userName: {
        type: String,
        index: {
            type: "global",
            name: "userNameIndex",
        },
    },
    displayName: {
        type: String,
    },
    isVerified: {
        type: Boolean,
    },
    roles: {
        type: Array,
        schema: [String],
    },
    failedLoginAttempts: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: String,
        default: new Date().toISOString(),
    },
});

export const UserModel = dynamoose.model<Item & Account>("User", UserSchema);

export default User;
