import type { User } from "@passkeys/types";

export class UserSession implements User.Session {
    public static algorithm = "EdDSA";

    public readonly userId: string;

    public readonly issuedAt: number;

    public readonly expiresAt: number;

    constructor(userSession: User.Session) {
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
