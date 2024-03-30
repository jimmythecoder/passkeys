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

