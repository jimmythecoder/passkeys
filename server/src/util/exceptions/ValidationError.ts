import { HttpStatusCode } from "../constants.js";
import { CustomError } from "./CustomError";

export class ValidationError extends CustomError {
    constructor(message: string) {
        super(message, HttpStatusCode.BadRequest);
    }
}

export default ValidationError;
