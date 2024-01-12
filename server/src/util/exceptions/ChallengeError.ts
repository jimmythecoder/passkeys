import { HttpStatusCode } from "../constants";
import { CustomError } from "./CustomError";

export class ChallengeError extends CustomError {
    constructor(message: string) {
        super(message, HttpStatusCode.Fobidden);
    }
}

export default ChallengeError;
