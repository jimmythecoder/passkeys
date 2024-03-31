import dynamoose from "dynamoose";
import { Item } from "dynamoose/dist/Item";
import { MAX_FAILED_LOGIN_ATTEMPTS } from "@/constants";

export type UserType = {
    id: string;
    userName: string;
    displayName: string;
    roles: string[];
    isVerified?: boolean;
    failedLoginAttempts: number;
    isLocked: boolean;
};

export enum UserRoles {
    Basic = "basic",
    Admin = "admin",
}

export type UserModelType = Item & UserType;

export class User implements User {
    public readonly id: string;

    public readonly userName: string;

    public readonly displayName: string;

    public readonly roles: string[];

    public isVerified?: boolean;

    public failedLoginAttempts: number;

    constructor(user: Partial<UserType> = {}) {
        this.id = user.id ?? crypto.randomUUID();
        this.userName = user.userName ?? this.id;
        this.displayName = user.displayName ?? "Anonymous";
        this.isVerified = user.isVerified ?? false;
        this.roles = user.roles ?? [UserRoles.Basic];
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
