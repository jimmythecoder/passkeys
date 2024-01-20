import { API_URL } from "@/config";
import * as xray from "@/utils/xray";
import * as Exceptions from "@/exceptions";

function isEmpty(value: unknown) {
    return value == null || value === "";
}

const jsonAPI = (apiURL: string, method = "POST") => {
    return async <T, U = void>(path: string, data?: U, signal?: AbortSignal) => {
        const body = !isEmpty(data) && method !== "GET" ? JSON.stringify(data) : null;
        const url = `${apiURL}${path}`;
        const segment = xray.startSegment(path);
        const traceHeader = xray.getTraceHeader(segment);

        const response = await fetch(url, {
            signal,
            method,
            headers: {
                "Content-Type": "application/json",
                "X-Amzn-Trace-Id": traceHeader,
            },
            credentials: "include",
            body,
        });

        if (response.headers.has("X-Amzn-Trace-Id")) {
            console.debug("X-Ray trace header", response.headers.get("X-Amzn-Trace-Id"));
            const closeSegment = xray.endSegment(segment);
            console.debug("X-Ray segment closed", closeSegment);
        }

        const isJSON = response.headers.get("content-type")?.includes("application/json");

        if (!response.ok) {
            if (isJSON) {
                const error = (await response.json()) as Exceptions.Exception;

                switch (error.name) {
                    case "InvalidStateError":
                        throw new Exceptions.AuthenticatorAlreadyExists(error);
                    case "AuthenticatorAlreadyExists":
                        throw new Exceptions.AuthenticatorAlreadyExists(error);
                    case "AuthenticatorMismatch":
                        throw new Exceptions.AuthenticatorMismatch(error);
                    case "AuthenticatorNotFound":
                        throw new Exceptions.AuthenticatorNotFound(error);
                    case "SessionNotFound":
                        throw new Exceptions.SessionNotFound(error);
                    case "Unauthorized":
                        throw new Exceptions.Unauthorized(error);
                    case "UserAlreadyExists":
                        throw new Exceptions.UserAlreadyExists(error);
                    case "UserNotFound":
                        throw new Exceptions.UserNotFound(error);
                    case "ValidationError":
                        throw new Exceptions.ValidationError(error);
                    case "VerificationError":
                        throw new Exceptions.VerificationError(error);
                    default:
                        throw new Exceptions.Exception(error);
                }
            }

            throw new Error(await response.text());
        }

        if (response.status === 204) return {} as unknown as T;

        return isJSON ? ((await response.json()) as T) : (response.text() as unknown as T);
    };
};

export const post = jsonAPI(API_URL, "POST");
export const get = jsonAPI(API_URL, "GET");
export const del = jsonAPI(API_URL, "DELETE");
export const put = jsonAPI(API_URL, "PUT");

export default {
    get,
    post,
    del,
    put,
};
