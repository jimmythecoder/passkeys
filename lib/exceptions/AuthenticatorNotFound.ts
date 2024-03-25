import { ApiException } from "./ApiException";

export class AuthenticatorNotFound extends ApiException {
    constructor(detail: string) {
        super(detail, ApiException.Status.NotFound, "AuthenticatorNotFound");
    }
}

export default AuthenticatorNotFound;
