import { HttpStatusCode } from "../constants";
import { Exception } from "./Exception";

export class UserAlreadyExists extends Exception {
    constructor(detail: string) {
        super(detail, HttpStatusCode.Conflict, "UserAlreadyExists");
    }
}

export default UserAlreadyExists;
