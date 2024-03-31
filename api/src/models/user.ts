import dynamoose from "dynamoose";
import { Item } from "dynamoose/dist/Item";
import { MAX_FAILED_LOGIN_ATTEMPTS } from "@/constants";
import type { User as UserTypes } from "@passkeys/types";
import { Auth } from "@passkeys/config";

export type UserModelType = Item & UserTypes.Account;

export class User implements UserTypes.Account {
    public readonly id: string;

    public readonly userName: string;

    public readonly displayName: string;

    public readonly roles: UserTypes.Role[];

    public isVerified?: boolean;

    public failedLoginAttempts: number;

    constructor(user: Partial<UserTypes.Account> = {}) {
        this.id = user.id ?? crypto.randomUUID();
        this.userName = user.userName ?? this.id;
        this.displayName = user.displayName ?? "Anonymous";
        this.isVerified = user.isVerified ?? false;
        this.roles = user.roles ?? [Auth.UserRoles.Guest];
        this.failedLoginAttempts = user.failedLoginAttempts ?? 0;
    }

    /**
     * Whether the user is locked out.
     */
    get isLocked() {
        return this.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS;
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

export const UserModel = dynamoose.model<UserModelType>("User", UserSchema);

export default User;
