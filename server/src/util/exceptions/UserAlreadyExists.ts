import { HttpStatusCode } from "../constants";
import { Exception } from "./Exception";

export class UserAlreadyExists extends Exception {
    constructor(message: string) {
        super(message, HttpStatusCode.Fobidden, "UserAlreadyExists");
    }
}

export default UserAlreadyExists;
