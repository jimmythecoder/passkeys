import { HttpStatusCode } from "@/util/constants";

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
        super(message, HttpStatusCode.NotFound);
    }
}

export class ChallengeError extends CustomError {
    constructor(message: string) {
        super(message, HttpStatusCode.Fobidden);
    }
}

export class VerificationError extends CustomError {
    constructor(message: string) {
        super(message, HttpStatusCode.BadRequest);
    }
}

export class ValidationError extends CustomError {
    constructor(message: string) {
        super(message, HttpStatusCode.BadRequest);
    }
}


export class UserAlreadyExists extends CustomError {
    constructor(message: string) {
        super(message, HttpStatusCode.Fobidden);
    }
}

export class AuthenticatorNotFound extends CustomError {
    constructor(message: string) {
        super(message, HttpStatusCode.Fobidden);
    }
}

/**
 * This error is thrown when a user attempts to use an authenticator that is not the one they registered with.
 */
export class AuthenticatorMismatch extends CustomError {
    constructor(message: string) {
        super(message, HttpStatusCode.Fobidden);
    }
}

export class Unauthorized extends CustomError {
    constructor(message: string) {
        super(message, HttpStatusCode.Unauthorized);
    }
}

export class AuthenticatorAlreadyExists extends CustomError {
    constructor(message: string) {
        super(message, HttpStatusCode.Fobidden);
    }
}

export class SessionNotFound extends CustomError {
    constructor(message: string) {
        super(message, HttpStatusCode.Unauthorized);
    }
}
