import { HttpStatusCode } from "../constants.js";
import { CustomError } from "./CustomError.js";

export class AuthenticatorNotFound extends CustomError {
    constructor(message: string) {
        super(message, HttpStatusCode.Fobidden);
    }
}

export default AuthenticatorNotFound;
