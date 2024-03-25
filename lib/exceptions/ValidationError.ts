import { ApiException, Problem } from "./ApiException";

export class ValidationError extends ApiException<string> {
    constructor(
        public detail: string,
        public context?: string,
    ) {
        super(detail, ApiException.Status.UnprocessableEntity, "ValidationError");
    }

    toJSON() {
        return {
            ...super.toJSON(),
            context: this.context,
        };
    }

    public static fromJSON(error: Problem<string>) {
        return new ValidationError(error.detail, error.context);
    }
}

export default ValidationError;
