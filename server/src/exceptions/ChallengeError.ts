import { HttpStatusCode } from "../constants";
import { Exception } from "./Exception";

export class ChallengeError extends Exception {
    constructor(message: string) {
        super(message, HttpStatusCode.Fobidden, "ChallengeError");
    }
}

export default ChallengeError;
