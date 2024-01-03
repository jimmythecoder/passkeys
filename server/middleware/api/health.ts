import * as express from "express";

export const api = express.Router();

api.get("/status", async (_, res) => {
    res.json({ status: "ok" });
});
