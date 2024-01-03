import Fastify from "fastify";
import helmet from "helmet";
import fastifyExpress from "@fastify/express";
import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import { cors } from "./middleware/cors";
import { session } from "./middleware/session";
import { api as authApi } from "./middleware/api/auth";
import { api as healthApi } from "./middleware/api/health";
import { api as testApi } from "./middleware/api/test";
import { MetadataService } from "@simplewebauthn/server";
import dynamoose from "dynamoose";

dotenv.config();

const USE_LOCAL_DB = process.env.USE_LOCAL_DB === "true";
const USE_METADATA_SERVICE = process.env.USE_METADATA_SERVICE === "true";

const fastify = Fastify({
    logger: true,
});

const startServer = async () => {
    await fastify.register(fastifyExpress);

    fastify.use(express.urlencoded({ extended: true }));
    fastify.use(multer().none());
    fastify.use(express.json());
    fastify.use(helmet());
    fastify.use(cors);
    fastify.use(session(process.env.SESSION_COOKIE_NAME ?? "session", process.env.SESSION_SECRET ?? "secret", parseInt(process.env.SESSION_LIFETIME ?? "86400000", 10)));

    fastify.addHook("onReady", async () => {
        if (USE_METADATA_SERVICE) {
            return MetadataService.initialize().then(() => {
                console.log("🔐 MetadataService initialized");
                return;
            });
        }

        if (USE_LOCAL_DB) {
            dynamoose.aws.ddb.local();
        } else {
            new dynamoose.aws.ddb.DynamoDB({
                region: process.env.AWS_REGION
            });
        }
    });

    fastify.get("/", async (_, reply) => {
        reply.type("application/json").code(200);
        return { hello: "world" };
    });

    fastify.use("/api/auth", authApi);
    fastify.use("/api/health", healthApi);
    fastify.use("/api/test", testApi);

    return fastify;
};

startServer().then((server) =>
    server.listen({ host: "0.0.0.0", port: parseInt(process.env.PORT || "3001", 10) }, (err, address) => {
        if (err) {
            server.log.error(err);
            process.exit(1);
        }
        server.log.info(`server listening on ${address}`);
    })
);
