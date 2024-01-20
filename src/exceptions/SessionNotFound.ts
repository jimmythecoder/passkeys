import { Exception } from "./Exception";

export class SessionNotFound extends Exception {
    constructor(error: Exception) {
        super(error, "SessionNotFound");
    }
}

export default SessionNotFound;
