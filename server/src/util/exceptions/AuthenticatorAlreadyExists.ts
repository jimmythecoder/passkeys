import { HttpStatusCode } from "../constants";
import { Exception } from "./Exception";

/**
 * This error is thrown when a user attempts to register an authenticator that is already registered.
 */
export class AuthenticatorAlreadyExists extends Exception {
    constructor(message: string) {
        super(message, HttpStatusCode.Fobidden, "AuthenticatorAlreadyExists");
    }
}

export default AuthenticatorAlreadyExists;
