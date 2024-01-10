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
    name: process.env.SESSION_NAME,
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
console.debug("USE_LOCAL_DB", process.env.USE_LOCAL_DB);
const app = async () => {
    const fastify = Fastify({
        logger: true,
    });

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

        // if (USE_LOCAL_DB) {
        //     console.debug("🗄️ Using local DynamoDB");
        //     return dynamoose.aws.ddb.local(process.env.AWS_DYNAMODB_ENDPOINT);
        // }

        console.debug("🗄️ Using remote DynamoDB", {
            endpoint: process.env.AWS_DYNAMODB_ENDPOINT,
            region: process.env.AWS_REGION!,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
        });

        try {
            new dynamoose.aws.ddb.DynamoDB({
                endpoint: process.env.AWS_DYNAMODB_ENDPOINT,
                region: process.env.AWS_REGION!,
                credentials: {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
                },
            });
        } catch (e) {
            console.error("DynamoDB:", e);
        }
    });

    fastify.use("/api/auth", authApi);
    fastify.use("/api/health", healthApi);
    fastify.use("/api/test", testApi);

    if (import.meta.env.PROD) {
        fastify.listen({ host: "0.0.0.0", port: parseInt(process.env.PORT || "3001", 10) });
    }

    return fastify;
};

export const viteNodeApp = app();

export default viteNodeApp;
