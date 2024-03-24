export class Exception extends Error {
    public readonly type: string;

    constructor(
        public detail: string,
        public status: number,
        public name: string,
    ) {
        super(detail);

        this.type = `https://passkeys.jharris.nz/docs/api/exceptions/${this.name}`;
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
            title: this.name,
            detail: this.detail,
        };
    }

    toString() {
        return `[ERROR]: ${this.name}: ${this.detail}`;
    }
}

export default Exception;
