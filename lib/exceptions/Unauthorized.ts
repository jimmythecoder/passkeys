import { Exception, ProblemException } from "./Exception";

export class Unauthorized extends Exception implements ProblemException {
    constructor(detail: string) {
        super(detail, Exception.Status.Unauthorized, "Unauthorized");
    }
}

export default Unauthorized;
