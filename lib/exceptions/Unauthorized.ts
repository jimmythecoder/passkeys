import { Exception } from "./Exception";

export class Unauthorized extends Exception {
    constructor(detail: string) {
        super(detail, Exception.Status.Unauthorized, "Unauthorized");
    }
}

export default Unauthorized;
