import Fastify from "fastify";
import jwtSession from "express-session-jwt";
import helmet from "helmet";
import fastifyExpress from "@fastify/express";
import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { MetadataService } from "@simplewebauthn/server";
import dynamoose from "dynamoose";
import { cors } from "./middleware/cors";
import { api as authApi } from "./middleware/api/auth";
import { api as healthApi } from "./middleware/api/health";
import { api as testApi } from "./middleware/api/test";

dotenv.config();

const fileName = fileURLToPath(import.meta.url);
const dirName = path.dirname(fileName);
const serverRootDir = path.resolve(dirName);

const jwtSessionConfig = {
    secret: process.env.SESSION_SECRET ?? "secret",
    keys: {
        private: readFileSync(`${serverRootDir}${process.env.JWT_SESSION_PRIVATE_KEY_FILE_PATH}`, "utf8"),
        public: readFileSync(`${serverRootDir}${process.env.JWT_SESSION_PUBLIC_KEY_FILE_PATH}`, "utf8"),
    },
    resave: false,
    saveUninitialized: true,
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
            dynamoose.aws.ddb.local();
        } else {
            const ddb = new dynamoose.aws.ddb.DynamoDB({
                region: process.env.AWS_REGION,
            });

            console.debug("DynamoDB client created", ddb);
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
    }),
);
