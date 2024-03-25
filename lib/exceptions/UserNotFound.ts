import { ApiException } from "./ApiException";

export class UserNotFound extends ApiException {
    constructor(detail: string) {
        super(detail, ApiException.Status.NotFound, "UserNotFound");
    }
}

export default UserNotFound;
