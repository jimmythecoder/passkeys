import Fastify from "fastify";
import jwtSession from "express-session-jwt";
import helmet from "helmet";
import fastifyExpress from "@fastify/express";
import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import { MetadataService } from "@simplewebauthn/server";
import dynamoose from "dynamoose";
import { cors } from "./middleware/cors.js";
import { api as authApi } from "./middleware/api/auth.js";
import { api as healthApi } from "./middleware/api/health.js";
import { api as testApi } from "./middleware/api/test.js";
import JWTSessionKeys from "./keys.json";

dotenv.config();

const jwtSessionConfig = {
    secret: process.env.SESSION_SECRET ?? "secret",
    keys: {
        private: atob(JWTSessionKeys.private.pem),
        public: atob(JWTSessionKeys.public.pem),
    },
    cookie: {
        secure: process.env.HTTPS === "true",
        httpOnly: true,
        sameSite: "strict",
        maxAge: parseInt(process.env.SESSION_LIFETIME ?? "86400000", 10),
    },
} satisfies jwtSession.SessionOptions;

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
    fastify.use(jwtSession(jwtSessionConfig));

    fastify.addHook("onReady", async () => {
        if (USE_METADATA_SERVICE) {
            await MetadataService.initialize().then(() => {
                console.debug("🔐 MetadataService initialized");
            });
        }

        if (USE_LOCAL_DB) {
            return dynamoose.aws.ddb.local();
        }

        return new dynamoose.aws.ddb.DynamoDB({
            region: process.env.AWS_REGION!,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
        });
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
    }),
);
