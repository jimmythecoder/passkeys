export type CustomException = {
    code?: number;
    message: string;
};

export class Exception extends Error {
    code?: number;

    constructor(error: CustomException) {
        super(error.message);
        this.name = this.constructor.name;
        this.code = error.code;
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
