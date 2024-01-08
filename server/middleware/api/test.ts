import * as express from "express";
import dotenv from "dotenv";
import { Unauthorized, CustomError } from "@/util/exceptions.js";
import { HttpStatusCode } from "@/util/constants.js";

dotenv.config();

const api = express.Router();

api.get("/authorized", async (req, res) => {
    try {
        if (!req.session.isSignedIn) {
            throw new Unauthorized("Not signed in");
        }

        return res.json({ status: "ok" });
    } catch (error) {
        if (error instanceof CustomError) {
            console.error("Authorization failed", error.message);
            res.statusMessage = error.name;
            return res.status(error.code).json(error);
        }

        console.error(error);
        return res.status(HttpStatusCode.Unauthorized).json(error);
    }
});

api.get("/authorized/admin", async (req, res) => {
    try {
        if (!req.session.isSignedIn) {
            throw new Unauthorized("Not signed in");
        }

        if (!req.session.user?.roles.includes("admin")) {
            throw new Unauthorized("Missing admin role");
        }

        return res.json({ status: "ok" });
    } catch (error) {
        if (error instanceof CustomError) {
            console.error("Authorization failed", error.message);
            res.statusMessage = error.name;
            return res.status(error.code).json(error);
        }

        console.error(error);
        return res.status(HttpStatusCode.Unauthorized).json(error);
    }
});

export { api };
export default api;
