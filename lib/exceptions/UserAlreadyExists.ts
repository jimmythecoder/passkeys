import { Exception } from "./Exception";

export class UserAlreadyExists extends Exception {
    constructor(detail: string) {
        super(detail, Exception.Status.Conflict, "UserAlreadyExists");
    }
}

export default UserAlreadyExists;
