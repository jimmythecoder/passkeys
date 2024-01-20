import { HttpStatusCode } from "../constants";
import { Exception } from "./Exception";

export class Unauthorized extends Exception {
    constructor(message: string) {
        super(message, HttpStatusCode.Unauthorized, "Unauthorized");
    }
}

export default Unauthorized;
