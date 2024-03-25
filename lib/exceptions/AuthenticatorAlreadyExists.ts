import { ApiException } from "./ApiException";

/**
 * This error is thrown when a user attempts to register an authenticator that is already registered.
 */
export class AuthenticatorAlreadyExists extends ApiException {
    constructor(detail: string) {
        super(detail, ApiException.Status.Conflict, "AuthenticatorAlreadyExists");
    }
}

export default AuthenticatorAlreadyExists;
