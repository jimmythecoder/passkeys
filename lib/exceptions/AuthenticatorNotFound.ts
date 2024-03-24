import { Exception, ProblemException } from "./Exception";

export class AuthenticatorNotFound extends Exception implements ProblemException {
    constructor(detail: string) {
        super(detail, Exception.Status.NotFound, "AuthenticatorNotFound");
    }
}

export default AuthenticatorNotFound;
