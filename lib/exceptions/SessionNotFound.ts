import { ApiException } from "./ApiException";

/**
 * No session was found for the user. Usually a cookie / domain issue.
 */
export class SessionNotFound extends ApiException {
    constructor(detail: string) {
        super(detail, ApiException.Status.Unauthorized, "SessionNotFound");
    }
}

export default SessionNotFound;
