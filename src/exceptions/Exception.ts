export class Exception extends Error {
    constructor(
        message: string,
        public code: number,
    ) {
        super(message);
        this.name = this.constructor.name;
    }

    toJSON() {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
        };
    }
}

export default Exception;
