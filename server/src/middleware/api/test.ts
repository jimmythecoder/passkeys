import dotenv from "dotenv";
import type { FastifyPluginCallback } from "fastify";
import { Unauthorized, Exception } from "@/exceptions";
import { HttpStatusCode } from "@/constants";

dotenv.config();

export const api: FastifyPluginCallback = (fastify, _, next) => {
    fastify.get("/authorized", (request, reply) => {
        try {
            if (!request.session.get("isSignedIn")) {
                throw new Unauthorized("Not signed in");
            }

            return reply.send({ status: "ok" });
        } catch (error) {
            if (error instanceof Exception) {
                console.error("Authorization failed", error.message);
                return reply.status(error.code).send(error.toJSON());
            }

            console.error(error);
            return reply.status(HttpStatusCode.Unauthorized).send(error);
        }
    });

    fastify.get("/authorized/admin", (request, reply) => {
        try {
            if (!request.session.get("isSignedIn")) {
                throw new Unauthorized("Not signed in");
            }

            if (!request.session.get("user")?.roles.includes("admin")) {
                throw new Unauthorized("Missing admin role");
            }

            return reply.send({ status: "ok" });
        } catch (error) {
            if (error instanceof Exception) {
                console.error("Authorization failed", error.message);
                return reply.status(error.code).send(error);
            }

            console.error(error);
            return reply.status(HttpStatusCode.Unauthorized).send(error);
        }
    });

    next();
};

export default api;
