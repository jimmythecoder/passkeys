import dynamoose from "dynamoose";
import { Item } from "dynamoose/dist/Item";

export type UserType = {
    id: string;
    userName: string;
    displayName: string;
    roles: string[];
    isVerified?: boolean;
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

    constructor(user: Partial<UserType> = {}) {
        this.id = user.id ?? crypto.randomUUID();
        this.userName = user.userName ?? this.id;
        this.displayName = user.displayName ?? "Anonymous";
        this.isVerified = user.isVerified ?? false;
        this.roles = user.roles ?? [UserRoles.Basic];
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
});

export const UserModel = dynamoose.model<UserModelType>("User", UserSchema);

export default User;
