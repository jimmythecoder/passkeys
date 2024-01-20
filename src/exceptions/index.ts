import { AuthenticatorAlreadyExists } from "./AuthenticatorAlreadyExists";
import { AuthenticatorMismatch } from "./AuthenticatorMismatch";
import { AuthenticatorNotFound } from "./AuthenticatorNotFound";
import { Exception } from "./Exception";
import { SessionNotFound } from "./SessionNotFound";
import { Unauthorized } from "./Unauthorized";
import { UserAlreadyExists } from "./UserAlreadyExists";
import { UserNotFound } from "./UserNotFound";
import { ValidationError } from "./ValidationError";
import { VerificationError } from "./VerificationError";
import { UserAccountLocked } from "./UserAccountLocked";

export {
    AuthenticatorAlreadyExists,
    AuthenticatorMismatch,
    AuthenticatorNotFound,
    Exception,
    SessionNotFound,
    Unauthorized,
    UserAlreadyExists,
    UserNotFound,
    ValidationError,
    VerificationError,
    UserAccountLocked,
};

export default new Map([
    ["AuthenticatorAlreadyExists", AuthenticatorAlreadyExists],
    ["AuthenticatorMismatch", AuthenticatorMismatch],
    ["AuthenticatorNotFound", AuthenticatorNotFound],
    ["Exception", Exception],
    ["SessionNotFound", SessionNotFound],
    ["Unauthorized", Unauthorized],
    ["UserAlreadyExists", UserAlreadyExists],
    ["UserNotFound", UserNotFound],
    ["ValidationError", ValidationError],
    ["VerificationError", VerificationError],
    ["UserAccountLocked", UserAccountLocked],
]);
