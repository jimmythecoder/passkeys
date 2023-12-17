
const jsonAPI = (method = "POST") => {
    return async (url: string, data?: unknown) => {
        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: data ? JSON.stringify(data) : undefined,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}, ${response.statusText}}`);
        }

        const json = await response.json();

        return json;
    }
};

export const post = jsonAPI("POST");
export const get = jsonAPI("GET");

export default {
    get,
    post
};
