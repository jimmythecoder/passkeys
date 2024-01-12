import { HttpStatusCode } from "../constants";
import { CustomError } from "./CustomError";

export class Unauthorized extends CustomError {
    constructor(message: string) {
        super(message, HttpStatusCode.Unauthorized);
    }
}

export default Unauthorized;
