import { HttpStatusCode } from "../constants";
import { Exception } from "./Exception";

export class UserNotFound extends Exception {
    constructor(detail: string) {
        super(detail, HttpStatusCode.NotFound, "UserNotFound");
    }
}

export default UserNotFound;
