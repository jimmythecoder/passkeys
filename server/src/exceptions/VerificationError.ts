import { HttpStatusCode } from "../constants";
import { Exception } from "./Exception";

export class VerificationError extends Exception {
    constructor(message: string) {
        super(message, HttpStatusCode.BadRequest, "VerificationError");
    }
}

export default VerificationError;
