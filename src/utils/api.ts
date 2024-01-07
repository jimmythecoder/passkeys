import { API_URL } from "@/config";
import type { Error } from "@/types/api";

const jsonAPI = (apiURL: string, method = "POST") => {
    return async <T, U = void>(path: string, data?: U, signal?: AbortSignal) => {
        const body = !isEmpty(data) && method !== "GET" ? JSON.stringify(data) : null;
        const url = `${apiURL}${path}`;

        const response = await fetch(url, {
            signal,
            method,
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body,
        });

        const json = await response.json() as T;

        if (!response.ok) {
            throw new Error((json as Error).message);
        }

        return json;
    }
};

function isEmpty(value: unknown) {
    return value == null || value === "";
}

export const post = jsonAPI(API_URL, "POST");
export const get = jsonAPI(API_URL, "GET");

export default {
    get,
    post,
};
