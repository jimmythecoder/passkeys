import { Exception } from "./Exception";

export class Unauthorized extends Exception {
    constructor(error: Exception) {
        super(error, "Unauthorized");
    }
}

export default Unauthorized;
