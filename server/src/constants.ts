export enum HttpStatusCode {
    OK = 200,
    Created = 201,
    BadRequest = 400,
    Unauthorized = 401,
    NotFound = 404,
    Fobidden = 403,
    NoContent = 204,
}

/**
 * The number of failed login attempts before the user is locked out.
 */
export const MAX_FAILED_LOGIN_ATTEMPTS = 5;

export default { HttpStatusCode };
