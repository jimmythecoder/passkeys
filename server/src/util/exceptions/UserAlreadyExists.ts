import { HttpStatusCode } from "../constants.js";
import { CustomError } from "./CustomError";

export class UserAlreadyExists extends CustomError {
    constructor(message: string) {
        super(message, HttpStatusCode.Fobidden);
    }
}

export default UserAlreadyExists;
