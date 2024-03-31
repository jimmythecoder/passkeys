export type ProblemJSON<T = unknown> = {
    type: string;
    status: number;
    title: string;
    detail: string;
    context?: T;
};

export type Exception<T> = ProblemJSON<T> & {
    /**
     * Serialize the exception to a Problem JSON object that can be sent to the client using the RFC 9457 format.
     */
    toJSON(): ProblemJSON<T>;
};

export type ExceptionStatic = {
    new <T>(detail: string, status: number, title: string, context?: string): Exception<T>;

    /**
     * HTTP status codes that best represent the status of the exception.
     */
    Status: Record<string, number>;

    /**
     * Revive an exception from a Problem JSON object.
     * @param error The Problem JSON object representing the exception.
     */
    fromJSON<T>(error: ProblemJSON<T>): Exception<T>;
};
