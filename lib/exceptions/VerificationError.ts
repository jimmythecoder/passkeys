import { Exception, ProblemException } from "./Exception";

export class VerificationError extends Exception implements ProblemException {
    constructor(detail: string) {
        super(detail, Exception.Status.UnprocessableEntity, "VerificationError");
    }
}

export default VerificationError;
