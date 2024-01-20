import type { FastifyPluginCallback } from "fastify";

export const api: FastifyPluginCallback = (fastify, _, next) => {
    fastify.get("/status", (request, reply) => {
        console.debug("GET /api/health/status v2");
        reply.send({ status: "ok" });
    });

    next();
};

export default api;
