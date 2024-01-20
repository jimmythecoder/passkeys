import { Exception } from "./Exception";

export class VerificationError extends Exception {
    constructor(error: Exception) {
        super(error, "VerificationError");
    }
}

export default VerificationError;
