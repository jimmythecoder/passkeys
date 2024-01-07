export const ENDPOINTS = {
    auth: {
        signin: {
            getCredentials: "/api/auth/signin",
            verify: "/api/auth/signin/verify",
            getAllCredentails: "/api/auth/signin/passkey",
        },
        signout: "/api/auth/signout",
        register: {
            getCredentials: "/api/auth/register",
            verify: "/api/auth/register/verify",
        },
    },
    health: {
        status: "/api/health/status",
    },
    test: {
        authorizer: {
            basic: "/api/test/authorized",
            admin: "/api/test/authorized/admin",
        }
    }
};

export const API_URL = import.meta.env.VITE_API_URL ?? "/api";