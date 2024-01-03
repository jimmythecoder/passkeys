import * as express from "express";
import dotenv from "dotenv";
import { expressjwt, Request as JWTRequest } from "express-jwt";
import jwt from "jsonwebtoken";
import {  UserType } from "@/models/users";
import {  Unauthorized, CustomError } from "@/util/exceptions";
import { HttpStatusCode } from "@/util/constants";

dotenv.config();

export const api = express.Router();

const TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET ?? "catfish";
const TOKEN_ALGORITHIMS = [(process.env.TOKEN_ALGORITHIM as jwt.Algorithm) ?? "HS256"] satisfies jwt.Algorithm[];

const jwtAuthorizer = expressjwt({ secret: TOKEN_SECRET, algorithms: TOKEN_ALGORITHIMS });

api.get("/authorized", jwtAuthorizer, async (_, res) => {
    try {
        res.json({ status: "ok" });
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

api.get("/authorized/admin", jwtAuthorizer, async (req: JWTRequest<UserType>, res) => {
    try {
        if (!req.auth.roles.includes("admin")) {
            throw new Unauthorized("Missing admin role");
        }

        res.json({ status: "ok" });
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