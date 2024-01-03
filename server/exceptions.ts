export class CustomError extends Error {
    constructor(message: string, public code: number) {
        super(message);
        this.name = this.constructor.name;
    }

    toJSON() {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
        };
    }
}

export class UserNotFound extends CustomError {
    constructor(message: string) {
        super(message, 404);
    }
}

export class ChallengeError extends CustomError {
    constructor(message: string) {
        super(message, 401);
    }
}

export class UserAlreadyExists extends CustomError {
    constructor(message: string) {
        super(message, 400);
    }
}

export class AuthenticatorNotFound extends CustomError {
    constructor(message: string) {
        super(message, 401);
    }
}

/**
 * This error is thrown when a user attempts to use an authenticator that is not the one they registered with.
 */
export class AuthenticatorMismatch extends CustomError {
    constructor(message: string) {
        super(message, 401);
    }
}

export class AuthenticatorAlreadyExists extends CustomError {
}

export class SessionNotFound extends CustomError {
}
