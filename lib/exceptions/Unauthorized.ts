import { ApiException } from "./ApiException";

export class Unauthorized extends ApiException {
    constructor(detail: string) {
        super(detail, ApiException.Status.Unauthorized, "Unauthorized");
    }
}

export default Unauthorized;
