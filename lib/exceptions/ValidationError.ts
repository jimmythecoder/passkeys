import { ApiException } from "./ApiException";
import type { Api } from "@passkeys/types";

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

    public static fromJSON(error: Api.Problem.ProblemJSON<string>) {
        return new ValidationError(error.detail, error.context);
    }
}

export default ValidationError;
