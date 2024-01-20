import { HttpStatusCode } from "../constants";
import { Exception } from "./Exception";

export class AuthenticatorNotFound extends Exception {
    constructor(message: string) {
        super(message, HttpStatusCode.Fobidden, "AuthenticatorNotFound");
    }
}

export default AuthenticatorNotFound;
