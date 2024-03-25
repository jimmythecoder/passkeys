import { ApiException } from "./ApiException";

export class UserAccountLocked extends ApiException {
    constructor(detail: string) {
        super(detail, ApiException.Status.Unauthorized, "UserAccountLocked");
    }
}

export default UserAccountLocked;
