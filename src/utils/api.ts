import * as Exceptions from "@passkeys/exceptions";

function isEmpty(value: unknown) {
    return value == null || value === "";
}

type Options = {
    signal?: AbortSignal;
    reviver?: (key: string, value: unknown) => unknown;
};

const jsonAPI = (apiURL: string, method = "POST") => {
    return async <T, U = void>(path: string, data?: U, options: Options = {}) => {
        const body = !isEmpty(data) && method !== "GET" ? JSON.stringify(data) : null;
        const url = `${apiURL}${path}`;

        const response = await fetch(url, {
            signal: options.signal,
            method,
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body,
        });

        const isJSON = response.headers.get("content-type")?.includes("application/json");

        if (!response.ok) {
            if (isJSON) {
                const error = (await response.json()) as Exceptions.Exception;

                if (Object.keys(Exceptions).includes(error.title)) {
                    throw new Exceptions[error.title as unknown](error);
                }

                throw new Error(error.toString());
            }

            throw new Error(await response.text());
        }

        if (response.status === 204) return {} as unknown as T;

        if (options.reviver) {
            const text = await response.text();
            return JSON.parse(text, options.reviver) as T;
        }

        return isJSON ? ((await response.json()) as T) : (response.text() as unknown as T);
    };
};

export const post = jsonAPI("/api", "POST");
export const get = jsonAPI("/api", "GET");
export const del = jsonAPI("/api", "DELETE");
export const put = jsonAPI("/api", "PUT");

export default {
    get,
    post,
    del,
    put,
};
