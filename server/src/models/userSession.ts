import * as jose from "jose";

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
    private readonly algorithm = "EdDSA";

    public readonly userId: string;

    public readonly issuedAt: number;

    public readonly expiresAt: number;

    constructor(userSession: UserSessionType) {
        this.userId = userSession.userId;
        this.issuedAt = userSession.issuedAt;
        this.expiresAt = userSession.expiresAt;
    }

    async generateToken(jwk: JsonWebKey) {
        const key = await crypto.subtle.importKey("jwk", jwk, { name: jwk.alg ?? this.algorithm, namedCurve: "Ed25519" }, true, ["sign"]);

        const jwt = await new jose.SignJWT({
            userId: this.userId,
        })
            .setProtectedHeader({ alg: jwk.alg ?? this.algorithm })
            .setIssuedAt()
            .setIssuer("https://passkeys.jharris.nz")
            .setAudience("https://passkeys.jharris.nz")
            .setExpirationTime("2h")
            .sign(key);

        return jwt;
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
