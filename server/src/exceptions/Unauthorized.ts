import { HttpStatusCode } from "../constants";
import { Exception } from "./Exception";

export class Unauthorized extends Exception {
    constructor(detail: string) {
        super(detail, HttpStatusCode.Unauthorized, "Unauthorized");
    }
}

export default Unauthorized;
