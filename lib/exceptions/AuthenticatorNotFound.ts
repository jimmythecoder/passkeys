import { Exception } from "./Exception";

export class AuthenticatorNotFound extends Exception {
    constructor(detail: string) {
        super(detail, Exception.Status.NotFound, "AuthenticatorNotFound");
    }
}

export default AuthenticatorNotFound;
