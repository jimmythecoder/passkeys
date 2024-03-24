import { Exception, ProblemException } from "./Exception";

export class UserAccountLocked extends Exception implements ProblemException {
    constructor(detail: string) {
        super(detail, Exception.Status.Unauthorized, "UserAccountLocked");
    }
}

export default UserAccountLocked;
