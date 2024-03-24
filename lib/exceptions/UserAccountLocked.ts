import { Exception } from "./Exception";

export class UserAccountLocked extends Exception {
    constructor(detail: string) {
        super(detail, Exception.Status.Unauthorized, "UserAccountLocked");
    }
}

export default UserAccountLocked;
