import dotenv from "dotenv";
import type { FastifyPluginCallback } from "fastify";
import { Unauthorized, ApiException } from "@passkeys/exceptions";
import { Api as ApiConfig } from "@passkeys/config";

dotenv.config();

export const api: FastifyPluginCallback = (fastify, _, next) => {
    fastify.get("/authorized", (request, reply) => {
        try {
            if (!request.session.get("isSignedIn")) {
                throw new Unauthorized("Not signed in");
            }

            return reply.send({ status: "ok" });
        } catch (error) {
            if (error instanceof ApiException) {
                console.error("Authorization failed", error.message);
                return reply.type("application/problem+json").status(error.status).send(error.toJSON());
            }

            console.error(error);
            return reply.type("application/problem+json").status(ApiConfig.HttpStatusCode.Unauthorized).send(error);
        }
    });

    fastify.get("/authorized/admin", (request, reply) => {
        try {
            if (!request.session.get("isSignedIn")) {
                throw new Unauthorized("Not signed in");
            }

            if (!request.session.roles.includes("admin")) {
                throw new Unauthorized("Missing admin role");
            }

            return reply.send({ status: "ok" });
        } catch (error) {
            if (error instanceof ApiException) {
                console.error("Authorization failed", error.message);
                return reply.type("application/problem+json").status(error.status).send(error);
            }

            console.error(error);
            return reply.type("application/problem+json").status(ApiConfig.HttpStatusCode.Unauthorized).send(error);
        }
    });

    next();
};

export default api;
