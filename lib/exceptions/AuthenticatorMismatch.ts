import { ApiException } from "./ApiException";

/**
 * This error is thrown when a user attempts to use an authenticator that is not the one they registered with.
 */
export class AuthenticatorMismatch extends ApiException {
    constructor(detail: string) {
        super(detail, ApiException.Status.UnprocessableEntity, "AuthenticatorMismatch");
    }
}

export default AuthenticatorMismatch;
