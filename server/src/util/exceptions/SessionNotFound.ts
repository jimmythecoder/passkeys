import { HttpStatusCode } from "../constants";
import { CustomError } from "./CustomError";

/**
 * No session was found for the user. Usually a cookie / domain issue.
 */
export class SessionNotFound extends CustomError {
    constructor(message: string) {
        super(message, HttpStatusCode.Unauthorized);
    }
}

export default SessionNotFound;
