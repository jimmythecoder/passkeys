import { Exception } from "./Exception";

export class AuthenticatorNotFound extends Exception {
    constructor(error: Exception) {
        super(error, "AuthenticatorNotFound");
    }
}

export default AuthenticatorNotFound;
