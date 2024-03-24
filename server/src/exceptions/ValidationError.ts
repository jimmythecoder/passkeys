import { HttpStatusCode } from "../constants";
import { Exception } from "./Exception";

export class ValidationError extends Exception {
    constructor(
        public detail: string,
        public readonly param?: string,
    ) {
        super(detail, HttpStatusCode.UnprocessableEntity, "ValidationError");
    }

    toJSON() {
        return {
            ...super.toJSON(),
            context: this.param,
        };
    }
}

export default ValidationError;
