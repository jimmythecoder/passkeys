import * as Exceptions from "@passkeys/exceptions";
import type { Api } from "@passkeys/types";

function isEmpty(value: unknown) {
    return value == null || value === "";
}

export type Options = {
    signal?: AbortSignal;
    reviver?: (key: string, value: unknown) => unknown;
};

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export const useApi = (apiURL: string, method: HttpMethod = "GET") => {
    return async <T, U = void>(path: string, data?: U, options: Options = {}) => {
        const hasBody = !isEmpty(data);
        const body = hasBody && method !== "GET" ? JSON.stringify(data) : null;
        const url = `${apiURL}${path}`;

        const response = await fetch(url, {
            signal: options.signal,
            method,
            headers: {
                "Content-Type": hasBody || method === "GET" ? "application/json" : "text/plain",
            },
            credentials: "include",
            body,
        });

        const contentType = response.headers.get("content-type") ?? "text/plain";
        const isJSON = contentType.includes("application/problem+json") || contentType.includes("application/json");

        if (!response.ok) {
            if (isJSON) {
                const error = (await response.json()) as Api.Problem.ProblemJSON<any>;

                if (Object.keys(Exceptions).includes(error.title)) {
                    throw Exceptions[error.title as keyof typeof Exceptions].fromJSON(error);
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

export default useApi;
