import { HttpStatusCode } from "../constants";
import { Exception } from "./Exception";

export class UserNotFound extends Exception {
    constructor(message: string) {
        super(message, HttpStatusCode.NotFound, "UserNotFound");
    }
}

export default UserNotFound;
