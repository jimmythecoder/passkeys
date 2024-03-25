import { ApiException } from "./ApiException";

export class VerificationError extends ApiException {
    constructor(detail: string) {
        super(detail, ApiException.Status.UnprocessableEntity, "VerificationError");
    }
}

export default VerificationError;
