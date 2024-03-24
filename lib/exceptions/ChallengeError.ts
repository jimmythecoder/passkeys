import { Exception, ProblemException } from "./Exception";

export class ChallengeError extends Exception implements ProblemException {
    constructor(detail: string) {
        super(detail, Exception.Status.Fobidden, "ChallengeError");
    }
}

export default ChallengeError;
