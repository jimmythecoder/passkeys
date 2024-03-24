import { Exception, ProblemException } from "./Exception";

export class ValidationError extends Exception implements ProblemException {
    constructor(
        public detail: string,
        public readonly param?: string,
    ) {
        super(detail, Exception.Status.UnprocessableEntity, "ValidationError");
    }

    toJSON() {
        return {
            ...super.toJSON(),
            context: this.param,
        };
    }

    fromJSON(error: Exception): Exception {
        return new ValidationError(error.detail, error.context);
    }
}

export default ValidationError;
