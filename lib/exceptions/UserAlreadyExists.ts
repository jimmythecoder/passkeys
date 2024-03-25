import { ApiException } from "./ApiException";

export class UserAlreadyExists extends ApiException {
    constructor(detail: string) {
        super(detail, ApiException.Status.Conflict, "UserAlreadyExists");
    }
}

export default UserAlreadyExists;
