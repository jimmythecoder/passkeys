const jsonAPI = (apiURL: string, method = "POST") => {
    return async (path: string, data?: unknown, signal?: AbortSignal) => {

        const body = !isEmpty(data) && method !== "GET" ? JSON.stringify(data) : null;
        const params = !isEmpty(data) && method === "GET" ? new URLSearchParams(data as Record<string, string>) : null;
        const url = `${apiURL}${path}${params ? `?${params}` : ""}`;
        const token = sessionStorage.getItem("auth_token");

        console.debug(`API ${method} ${url}`);

        const response = await fetch(url, {
            signal,
            method,
            headers: {
                "Content-Type": "application/json",
                Authorization: token ? `Bearer ${token}` : "",
            },
            credentials: "include",
            body,
        });

        const json = await response.json();

        if (!response.ok) {
            throw new Error(json.message);
        }

        return json;
    }
};

export const endpoints = {
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

function isEmpty(value: unknown) {
    return value == null || value === "";
}

const API_URL = import.meta.env.VITE_API_URL ?? "/api";
console.log("API_URL", API_URL);

export const post = jsonAPI(API_URL, "POST");
export const get = jsonAPI(API_URL, "GET");

export default {
    get,
    post,
    endpoints,
};
