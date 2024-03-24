import { HttpStatusCode } from "../constants";
import { Exception } from "./Exception";

export class UserAccountLocked extends Exception {
    constructor(detail: string) {
        super(detail, HttpStatusCode.Unauthorized, "UserAccountLocked");
    }
}

export default UserAccountLocked;
