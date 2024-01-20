import { Exception } from "./Exception";

export class UserAccountLocked extends Exception {
    constructor(error: Exception) {
        super(error, "UserAccountLocked");
    }
}

export default UserAccountLocked;
