import { Api } from "@passkeys/types";

export class ApiException<T = unknown> extends Error implements Api.Problem.Exception<T> {
    public readonly type: string;

    public static Status = {
        OK: 200,
        Created: 201,
        Accepted: 202,
        NoContent: 204,
        BadRequest: 400,
        Unauthorized: 401,
        Fobidden: 403,
        NotFound: 404,
        Conflict: 409,
        UnprocessableEntity: 422,
        InternalServerError: 500,
        GatewayTimeout: 504,
    };

    constructor(
        public detail: string,
        public status: number,
        public title: string,
        public context?: T,
    ) {
        super(detail);

        this.type = `https://passkeys.jharris.nz/docs/api/exceptions/${this.title}`;
    }

    /**
     * Convert the exception to a JSON object that can be sent to the client using the RFC 9457 format.
     * @url https://datatracker.ietf.org/doc/html/rfc9457
     * @returns {object} The JSON object representing the exception.
     */
    toJSON() {
        return {
            type: this.type,
            status: this.status,
            title: this.title,
            detail: this.detail,
            context: this.context,
        };
    }

    public static fromJSON(error: Api.Problem.ProblemJSON<unknown>) {
        return new this(error.detail, error.status, error.title, error.context);
    }

    toString() {
        return `[ERROR ${this.status}]: ${this.title}: ${this.detail}`;
    }
}

export default ApiException;
