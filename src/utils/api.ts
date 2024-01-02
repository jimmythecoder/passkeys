
const jsonAPI = (method = "POST") => {
    return async (url: string, data?: unknown) => {

        const body = data && method !== "GET" ? JSON.stringify(data) : undefined;
        const params = data && method === "GET" ? `?${new URLSearchParams(data as Record<string, string>).toString()}` : "";

        const response = await fetch(`${url}${params}`, {
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

export const post = jsonAPI("POST");
export const get = jsonAPI("GET");

export default {
    get,
    post
};
