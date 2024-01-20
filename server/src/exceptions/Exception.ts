export class Exception extends Error {
    constructor(
        public message: string,
        public code: number,
        public name: string,
    ) {
        super(message);
    }

    toJSON() {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
        };
    }

    toString() {
        return `[ERROR]: ${this.name}: ${this.message}`;
    }
}

export default Exception;
