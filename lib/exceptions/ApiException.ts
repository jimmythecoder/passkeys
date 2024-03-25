export type Problem<T = unknown> = {
    type: string;
    status: number;
    title: string;
    detail: string;
    context?: T;
};

export type ProblemException<T> = Problem<T> & {
    /**
     * Serialize the exception to a Problem JSON object that can be sent to the client using the RFC 9457 format.
     */
    toJSON(): Problem<T>;
};

export type ProblemExceptionStatic = {
    new <T>(detail: string, status: number, title: string, context?: string): ProblemException<T>;

    /**
     * HTTP status codes that best represent the status of the exception.
     */
    Status: Record<string, number>;

    /**
     * Revive an exception from a Problem JSON object.
     * @param error The Problem JSON object representing the exception.
     */
    fromJSON<T>(error: Problem<T>): ProblemException<T>;
};

export class ApiException<T = unknown> extends Error implements ProblemException<T> {
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

    public static fromJSON(error: Problem<unknown>) {
        return new this(error.detail, error.status, error.title, error.context);
    }

    toString() {
        return `[ERROR ${this.status}]: ${this.title}: ${this.detail}`;
    }
}

export default ApiException;
