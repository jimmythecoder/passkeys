import Fastify from "fastify";
import helmet from "@fastify/helmet";
import cookie from "@fastify/cookie";
import type { FastifyCookieOptions } from "@fastify/cookie";
import dotenv from "dotenv";
import { MetadataService } from "@simplewebauthn/server";
import dynamoose from "dynamoose";
import { getSSMParameters } from "@/util/ssm";
import { api as authApi } from "@/middleware/api/auth";
import { api as healthApi } from "@/middleware/api/health";
import { api as testApi } from "@/middleware/api/test";
import { jwtStatelessSession } from "@/plugins/jwt-stateless-session";

dotenv.config();

const USE_METADATA_SERVICE = process.env.USE_METADATA_SERVICE === "true";
const IS_PROD = process.env.NODE_ENV === "production";

const init = async () => {
    console.debug("Starting server ...");
    const app = Fastify({
        logger: true,
    });

    const [privateKey, publicKeys] = await getSSMParameters([process.env.JWK_PRIVATE_KEY!, process.env.JWKS_PUBLIC_KEYS!]);

    await app.register(helmet);
    await app.register(cookie, {
        secret: process.env.COOKIE_SECRET,
    } as FastifyCookieOptions);
    await app.register(jwtStatelessSession, {
        jwt: {
            issuer: process.env.JWT_ISSUER ?? "https://localhost:3000",
            audience: process.env.JWT_AUDIENCE ?? "localhost:3000",
            sign: {
                key: JSON.parse(privateKey.Value!),
                algorithm: "EdDSA",
                expiresIn: "2h",
            },
            verify: {
                keys: JSON.parse(publicKeys.Value!),
                algorithms: ["EdDSA"],
            },
        },
        cookie: {
            name: process.env.SESSION_COOKIE_NAME ?? "session",
            path: "/api",
            httpOnly: true,
            secure: IS_PROD,
            maxAge: parseInt(process.env.SESSION_LIFETIME ?? "7200", 10),
            sameSite: "strict",
            domain: process.env.SESSION_COOKIE_DOMAIN ?? "localhost",
        },
    });

    await app.register(healthApi, { prefix: "/api/health" });
    await app.register(testApi, { prefix: "/api/test" });
    await app.register(authApi, { prefix: "/api/auth" });

    app.addHook("onReady", async () => {
        console.debug("Server ready ... ", IS_PROD ? "PROD" : "DEV");
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
        server.listen({ host: "0.0.0.0", port: parseInt(process.env.PORT ?? "3000", 10) }, (err, address) => {
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
