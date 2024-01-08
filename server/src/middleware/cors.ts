import config from "cors";

export const cors = config({
    credentials: true,
    origin: (origin, callback) => {
        callback(null, origin);
    },
});

export default cors;
