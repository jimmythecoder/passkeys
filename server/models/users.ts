import dynamoose from "dynamoose";
import { Item } from "dynamoose/dist/Item";

export type UserType = {
    id: string;
    userName: string;
    displayName: string;
    roles: string[];
    isVerified?: boolean;
};


export type UserSessionType = {
    /**
     * The user ID of the user that owns this session.
     */
    userId: string;

    /**
     * The time the session was issued.
     */
    issuedAt: number;

    /**
     * The time the session expires.
     */
    expiresAt: number;
};

export interface IUserSession extends UserSessionType {
    /**
     * Whether the session has expired.
     */
    isExpired: boolean;

    /**
     * Whether the session is valid.
     */
    isValid: boolean;

    /**
     * Get the duration of the session in milliseconds since it was issued.
     */
    duration: number;
}

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

export class UserSession implements IUserSession {
    public readonly userId: string;
    public readonly issuedAt: number;
    public readonly expiresAt: number;

    constructor(userSession: UserSessionType) {
        this.userId = userSession.userId;
        this.issuedAt = userSession.issuedAt;
        this.expiresAt = userSession.expiresAt;
    }

    get isExpired() {
        return Date.now() > this.expiresAt;
    }

    get isValid() {
        return !this.isExpired;
    }

    get duration() {
        return Date.now() - new Date(this.issuedAt).getTime();
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
