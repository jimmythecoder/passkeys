import { Exception, ProblemException } from "./Exception";

/**
 * This error is thrown when a user attempts to register an authenticator that is already registered.
 */
export class AuthenticatorAlreadyExists extends Exception implements ProblemException {
    constructor(detail: string) {
        super(detail, Exception.Status.Conflict, "AuthenticatorAlreadyExists");
    }
}

export default AuthenticatorAlreadyExists;
