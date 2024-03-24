import { Exception } from "./Exception";

export class ChallengeError extends Exception {
    constructor(detail: string) {
        super(detail, Exception.Status.Fobidden, "ChallengeError");
    }
}

export default ChallengeError;
