import { Exception } from "./Exception";

export class AuthenticatorAlreadyExists extends Exception {
    constructor(error: Exception) {
        super(error, "AuthenticatorAlreadyExists");
    }
}

export default AuthenticatorAlreadyExists;
