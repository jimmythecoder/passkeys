import { ApiException } from "./ApiException";

export class ChallengeError extends ApiException {
    constructor(detail: string) {
        super(detail, ApiException.Status.Fobidden, "ChallengeError");
    }
}

export default ChallengeError;
