type Segment = {
    trace_id: string;
    id: string;
    start_time: number;
    end_time: number;
    name: string;
    in_progress: boolean;
    annotations?: Record<string, string>;
};

const getHexTime = () => {
    return Math.round(new Date().getTime() / 1000).toString(16);
};

const getEpochTime = () => {
    return new Date().getTime() / 1000;
};

const getHexId = (length: number) => {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    let hex = "";
    for (let i = 0; i < bytes.length; i += 1) {
        hex += bytes[i].toString(16);
    }
    return hex.substring(0, length);
};

export const generateTraceId = () => {
    return `1-${getHexTime()}-${getHexId(24)}`;
};

export const getTraceHeader = (segment: Segment) => {
    return `Root=${segment.trace_id};Parent=${segment.id};Sampled=1`;
};

export const startSegment = (name: string, annotations = {}): Segment => {
    return {
        trace_id: generateTraceId(),
        id: getHexId(16),
        start_time: getEpochTime(),
        end_time: getEpochTime(),
        name,
        in_progress: true,
        annotations,
    };
};

export const endSegment = (segment: Segment): Segment => {
    return {
        ...segment,
        end_time: getEpochTime(),
        in_progress: false,
    };
};

export const HTTP_HEADER = "X-Amzn-Trace-Id";
