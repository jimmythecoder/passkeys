import dynamoose from "dynamoose";
import { Item } from "dynamoose/dist/Item";

export type UserModel = {
    id: string;
    userName: string;
    displayName: string;
    currentChallenge?: string;
    isVerified?: boolean;
};

export type UserItem = Item & {
    id: string;
    userName: string;
    displayName: string;
    currentChallenge?: string;
    isVerified?: boolean;
}

export const users = [] as UserModel[];

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
    currentChallenge: {
        type: String,
    },
    isVerified: {
        type: Boolean,
    },
});

export const User = dynamoose.model<UserItem>("User", UserSchema);
