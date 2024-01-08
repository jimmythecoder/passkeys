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

export default UserSession;
