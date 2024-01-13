import Fastify from "fastify";
import helmet from "@fastify/helmet";
import session from "@fastify/secure-session";
import dotenv from "dotenv";
import { MetadataService } from "@simplewebauthn/server";
import dynamoose from "dynamoose";
import fs from "node:fs";
import { api as authApi } from "./middleware/api/auth";
import { api as healthApi } from "./middleware/api/health";
import { api as testApi } from "./middleware/api/test";

dotenv.config();

const USE_METADATA_SERVICE = process.env.USE_METADATA_SERVICE === "true";
const IS_PROD = process.env.NODE_ENV === "production";
const SESSION_KEY = process.env.SESSION_HEX_KEY ?? "0xdeadbeef";

const init = async () => {
    const app = Fastify({
        logger: true,
    });

    await app.register(helmet);
    await app.register(session, {
        sessionName: process.env.SESSION_NAME,
        cookieName: process.env.SESSION_COOKIE_NAME,
        key: Buffer.from(SESSION_KEY, "hex"),
        cookie: {
            path: "/",
            httpOnly: true,
            secure: IS_PROD,
            maxAge: parseInt(process.env.SESSION_LIFETIME ?? "86400000", 10),
            sameSite: "strict",
        },
    });

    await app.register(healthApi, { prefix: "/api/health" });
    await app.register(testApi, { prefix: "/api/test" });
    await app.register(authApi, { prefix: "/api/auth" });

    app.addHook("onReady", async () => {
        console.debug("Server ready... ", IS_PROD ? "PROD" : "DEV");
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

if (!IS_PROD) {
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

export { init };
export default init;
