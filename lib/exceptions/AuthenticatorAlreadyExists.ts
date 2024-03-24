import { Exception } from "./Exception";

/**
 * This error is thrown when a user attempts to register an authenticator that is already registered.
 */
export class AuthenticatorAlreadyExists extends Exception {
    constructor(detail: string) {
        super(detail, Exception.Status.Conflict, "AuthenticatorAlreadyExists");
    }
}

export default AuthenticatorAlreadyExists;
