import { Exception } from "./Exception";

export class VerificationError extends Exception {
    constructor(detail: string) {
        super(detail, Exception.Status.UnprocessableEntity, "VerificationError");
    }
}

export default VerificationError;
