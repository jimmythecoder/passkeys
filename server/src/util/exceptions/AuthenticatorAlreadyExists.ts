import { HttpStatusCode } from "../constants.js";
import { CustomError } from "./CustomError";

/**
 * This error is thrown when a user attempts to register an authenticator that is already registered.
 */
export class AuthenticatorAlreadyExists extends CustomError {
    constructor(message: string) {
        super(message, HttpStatusCode.Fobidden);
    }
}

export default AuthenticatorAlreadyExists;
