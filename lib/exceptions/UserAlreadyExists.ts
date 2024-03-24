import { Exception, ProblemException } from "./Exception";

export class UserAlreadyExists extends Exception implements ProblemException {
    constructor(detail: string) {
        super(detail, Exception.Status.Conflict, "UserAlreadyExists");
    }
}

export default UserAlreadyExists;
