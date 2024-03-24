export class Exception extends Error {
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
        };
    }

    toString() {
        return `[ERROR]: ${this.title}: ${this.detail}`;
    }
}

export default Exception;
