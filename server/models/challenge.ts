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

        return null;
    }

    isValid() {
        return !!this.challenge && !this.isChallengeExpired();
    }

    isChallengeExpired() {
        return Date.now() > this.expires;
    }
}

export default AuthChallenge;
