import Fastify from "fastify";
import jwtSession from "express-session-jwt";
import helmet from "helmet";
import fastifyExpress from "@fastify/express";
import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import { MetadataService } from "@simplewebauthn/server";
import dynamoose from "dynamoose";
import { cors } from "./middleware/cors";
import { api as authApi } from "./middleware/api/auth";
import { api as healthApi } from "./middleware/api/health";
import { api as testApi } from "./middleware/api/test";
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

const USE_METADATA_SERVICE = process.env.USE_METADATA_SERVICE === "true";

export const init = () => {
    const app = Fastify({
        logger: true,
    });

    app.register(fastifyExpress).then(() => {
        app.use(express.urlencoded({ extended: true }));
        app.use(multer().none());
        app.use(express.json());
        app.use(helmet());
        app.use(cors);
        app.use(jwtSession(jwtSessionConfig));
        app.use("/api/auth", authApi);
        app.use("/api/health", healthApi);
        app.use("/api/test", testApi);
    });

    app.addHook("onReady", async () => {
        if (USE_METADATA_SERVICE) {
            await MetadataService.initialize().then(() => {
                console.debug("🔐 MetadataService initialized");
            });
        }

        new dynamoose.aws.ddb.DynamoDB({
            endpoint: process.env.AWS_DYNAMODB_ENDPOINT,
            region: process.env.AWS_REGION!,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
        });
    });
    
    return app;
};

if (require.main === module) {
    init().then((server) =>
        server.listen({ host: "0.0.0.0", port: parseInt(process.env.PORT || "3001", 10) }, (err, address) => {
            if (err) {
                server.log.error(err);
                process.exit(1);
            }
            server.log.info(`server listening on ${address}`);
        }),
    );
}

export default init;
