import dynamoose from "dynamoose";
import { Item } from "dynamoose/dist/Item";

export type UserType = {
    id: string;
    userName: string;
    displayName: string;
    isVerified?: boolean;
};

export type UserModelType = Item & UserType;

export class User implements User {
    public readonly id: string;
    public readonly userName: string;
    public readonly displayName: string;
    public isVerified?: boolean;

    constructor(user: Partial<UserType> = {}) {
        this.id = user.id ?? crypto.randomUUID();
        this.userName = user.userName ?? this.id;
        this.displayName = user.displayName ?? "Anonymous";
        this.isVerified = user.isVerified ?? false;
    }
}

export class AuthChallenge {
    public readonly challenge: string;
    public readonly maxAge: number = 360;
    public readonly expires: number;

    constructor(authChallenge: Partial<AuthChallenge> = {}) {
        this.challenge = authChallenge.challenge ?? crypto.randomUUID();
        this.maxAge = authChallenge.maxAge ?? this.maxAge;
        this.expires = authChallenge.expires ?? Date.now() + this.maxAge * 1000;
    }

    get currentChallenge() {
        if (this.isValid()) {
            return this.challenge;
        }
    }

    isValid() {
        return !!this.challenge && !this.isChallengeExpired();
    }

    isChallengeExpired() {
        return Date.now() > this.expires;
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
});

export const UserModel = dynamoose.model<UserModelType>("User", UserSchema);
