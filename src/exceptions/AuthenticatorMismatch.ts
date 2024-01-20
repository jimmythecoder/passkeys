import { Exception } from "./Exception";

export class AuthenticatorMismatch extends Exception {
    constructor(error: Exception) {
        super(error, "AuthenticatorMismatch");
    }
}

export default AuthenticatorMismatch;
