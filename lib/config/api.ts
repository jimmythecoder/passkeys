export const API_PREFIX = "/api";

export const API_ENDPOINTS = {
    auth: {
        signin: {
            getCredentials: "/auth/signin",
            verify: "/auth/signin/verify",
            getAllCredentails: "/auth/signin/passkey",
        },
        signout: "/auth/signout",
        session: "/auth/session",
        register: {
            getCredentials: "/auth/register",
            verify: "/auth/register/verify",
        },
    },
    health: {
        status: "/health/status",
    },
    test: {
        authorizer: {
            basic: "/test/authorized",
            admin: "/test/authorized/admin",
        },
    },
};

export enum HttpStatusCode {
    OK = 200,
    Created = 201,
    Accepted = 202,
    NoContent = 204,
    BadRequest = 400,
    Unauthorized = 401,
    Fobidden = 403,
    NotFound = 404,
    Conflict = 409,
    UnprocessableEntity = 422,
    InternalServerError = 500,
    GatewayTimeout = 504,
}

/**
 * The number of failed login attempts before the user is locked out.
 */
export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
