import { HttpStatusCode } from "../constants";
import { Exception } from "./Exception";

export class UserAccountLocked extends Exception {
    constructor(message: string) {
        super(message, HttpStatusCode.Unauthorized, "UserAccountLocked");
    }
}

export default UserAccountLocked;
