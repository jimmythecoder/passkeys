import * as express from "express";

const api = express.Router();

api.get("/status", async (_, res) => {
    res.json({ status: "ok" });
});

export { api };
export default api;
