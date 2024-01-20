import { HttpStatusCode } from "../constants";
import { Exception } from "./Exception";

export class ValidationError extends Exception {
    constructor(
        public message: string,
        public readonly param?: string,
    ) {
        super(message, HttpStatusCode.BadRequest, "ValidationError");
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
