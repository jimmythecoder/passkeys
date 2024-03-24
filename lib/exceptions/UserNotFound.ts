import { Exception } from "./Exception";

export class UserNotFound extends Exception {
    constructor(detail: string) {
        super(detail, Exception.Status.NotFound, "UserNotFound");
    }
}

export default UserNotFound;
