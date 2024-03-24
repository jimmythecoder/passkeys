import { HttpStatusCode } from "../constants";
import { Exception } from "./Exception";

export class ChallengeError extends Exception {
    constructor(detail: string) {
        super(detail, HttpStatusCode.Fobidden, "ChallengeError");
    }
}

export default ChallengeError;
