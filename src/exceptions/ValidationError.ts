import { Exception } from "./Exception";

export class ValidationError extends Exception {
    constructor(error: Exception) {
        super(error, "ValidationError");
    }
}

export default ValidationError;
