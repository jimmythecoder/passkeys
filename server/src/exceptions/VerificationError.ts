import { HttpStatusCode } from "../constants";
import { Exception } from "./Exception";

export class VerificationError extends Exception {
    constructor(detail: string) {
        super(detail, HttpStatusCode.UnprocessableEntity, "VerificationError");
    }
}

export default VerificationError;
