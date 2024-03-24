import { HttpStatusCode } from "../constants";
import { Exception } from "./Exception";

export class AuthenticatorNotFound extends Exception {
    constructor(detail: string) {
        super(detail, HttpStatusCode.NotFound, "AuthenticatorNotFound");
    }
}

export default AuthenticatorNotFound;
