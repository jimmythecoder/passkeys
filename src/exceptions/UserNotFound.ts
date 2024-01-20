import { Exception } from "./Exception";

export class UserNotFound extends Exception {
    constructor(error: Exception) {
        super(error, "UserNotFound");
    }
}

export default UserNotFound;
