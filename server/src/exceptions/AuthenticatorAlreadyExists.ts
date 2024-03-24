import { HttpStatusCode } from "../constants";
import { Exception } from "./Exception";

/**
 * This error is thrown when a user attempts to register an authenticator that is already registered.
 */
export class AuthenticatorAlreadyExists extends Exception {
    constructor(detail: string) {
        super(detail, HttpStatusCode.Conflict, "AuthenticatorAlreadyExists");
    }
}

export default AuthenticatorAlreadyExists;
