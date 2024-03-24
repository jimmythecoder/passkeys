import { Exception, ProblemException } from "./Exception";

export class UserNotFound extends Exception implements ProblemException {
    constructor(detail: string) {
        super(detail, Exception.Status.NotFound, "UserNotFound");
    }
}

export default UserNotFound;
