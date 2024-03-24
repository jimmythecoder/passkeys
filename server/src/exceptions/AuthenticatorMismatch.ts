import { HttpStatusCode } from "../constants";
import { Exception } from "./Exception";

/**
 * This error is thrown when a user attempts to use an authenticator that is not the one they registered with.
 */
export class AuthenticatorMismatch extends Exception {
    constructor(detail: string) {
        super(detail, HttpStatusCode.UnprocessableEntity, "AuthenticatorMismatch");
    }
}

export default AuthenticatorMismatch;
