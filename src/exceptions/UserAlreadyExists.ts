import { Exception } from "./Exception";

export class UserAlreadyExists extends Exception {
    constructor(error: Exception) {
        super(error, "UserAlreadyExists");
    }
}

export default UserAlreadyExists;
