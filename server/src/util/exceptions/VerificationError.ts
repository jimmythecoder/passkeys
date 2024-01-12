import { HttpStatusCode } from "../constants";
import { CustomError } from "./CustomError";

export class VerificationError extends CustomError {
    constructor(message: string) {
        super(message, HttpStatusCode.BadRequest);
    }
}

export default VerificationError;
