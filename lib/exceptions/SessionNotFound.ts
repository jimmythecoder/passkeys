import { Exception, ProblemException } from "./Exception";

/**
 * No session was found for the user. Usually a cookie / domain issue.
 */
export class SessionNotFound extends Exception implements ProblemException {
    constructor(detail: string) {
        super(detail, Exception.Status.Unauthorized, "SessionNotFound");
    }
}

export default SessionNotFound;
