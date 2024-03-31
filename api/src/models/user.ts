import dynamoose from "dynamoose";
import { Item } from "dynamoose/dist/Item";
import { Auth, Api as ApiConfig } from "@passkeys/config";
import type { User } from "@passkeys/types";

export type UserModelType = Item & User.Account;

export class Account implements User.Account {
    public readonly id: string;

    public readonly userName: string;

    public readonly displayName: string;

    public readonly roles: User.Role[];

    public isVerified?: boolean;

    public failedLoginAttempts: number;

    constructor(user: Partial<User.Account> = {}) {
        this.id = user.id ?? crypto.randomUUID();
        this.userName = user.userName ?? this.id;
        this.displayName = user.displayName ?? "Guest";
        this.isVerified = user.isVerified ?? false;
        this.roles = user.roles ?? [Auth.UserRoles.User];
        this.failedLoginAttempts = user.failedLoginAttempts ?? 0;
    }

    /**
     * Whether the user is locked out.
     */
    get isLocked() {
        return this.failedLoginAttempts >= ApiConfig.MAX_FAILED_LOGIN_ATTEMPTS;
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
});

export const UserAccountModel = dynamoose.model<UserModelType>("Account", UserSchema);

export default Account;
