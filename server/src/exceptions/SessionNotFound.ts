import { HttpStatusCode } from "../constants";
import { Exception } from "./Exception";

/**
 * No session was found for the user. Usually a cookie / domain issue.
 */
export class SessionNotFound extends Exception {
    constructor(detail: string) {
        super(detail, HttpStatusCode.Unauthorized, "SessionNotFound");
    }
}

export default SessionNotFound;
