import { Exception, ProblemException } from "./Exception";

/**
 * This error is thrown when a user attempts to use an authenticator that is not the one they registered with.
 */
export class AuthenticatorMismatch extends Exception implements ProblemException {
    constructor(detail: string) {
        super(detail, Exception.Status.UnprocessableEntity, "AuthenticatorMismatch");
    }
}

export default AuthenticatorMismatch;
