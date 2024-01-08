import { HttpStatusCode } from "../constants.js";
import { CustomError } from "./CustomError.js";

/**
 * This error is thrown when a user attempts to use an authenticator that is not the one they registered with.
 */
export class AuthenticatorMismatch extends CustomError {
    constructor(message: string) {
        super(message, HttpStatusCode.Fobidden);
    }
}

export default AuthenticatorMismatch;
