
const jsonAPI = (method = "POST") => {
    return async (url: string, data?: unknown, signal?: AbortSignal) => {

        const body = !isEmpty(data) && method !== "GET" ? JSON.stringify(data) : undefined;
        const params = !isEmpty(data) && method === "GET" ? `?${new URLSearchParams(data as Record<string, string>).toString()}` : "";

        const response = await fetch(`${url}${params}`, {
            signal,
            method,
            headers: {
                "Content-Type": "application/json",
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

function isEmpty(value: unknown) {
    return value == null || value === "";
}

export const post = jsonAPI("POST");
export const get = jsonAPI("GET");

export default {
    get,
    post
};
