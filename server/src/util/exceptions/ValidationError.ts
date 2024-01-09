import { HttpStatusCode } from "../constants.js";
import { CustomError } from "./CustomError";

export class ValidationError extends CustomError {
    constructor(
        message: string,
        public readonly param?: string,
    ) {
        super(message, HttpStatusCode.BadRequest);
    }

    toJSON() {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            param: this.param,
        };
    }
}

export default ValidationError;
