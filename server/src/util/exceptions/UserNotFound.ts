import { HttpStatusCode } from "../constants";
import { CustomError } from "./CustomError";

export class UserNotFound extends CustomError {
    constructor(message: string) {
        super(message, HttpStatusCode.NotFound);
    }
}

export default UserNotFound;
