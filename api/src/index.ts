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
import { Auth as AuthConfig } from "@passkeys/config";

dotenv.config({ path: [".env", ".env.local"], override: true });

const USE_METADATA_SERVICE = process.env.USE_METADATA_SERVICE === "true";
const IS_PROD = process.env.NODE_ENV === "production";

const init = async () => {
    const app = Fastify({
        logger: {
            level: IS_PROD ? "info" : "debug",
        },
    });

    const [privateKey, publicKeys] = await getSSMParameters([process.env.JWK_PRIVATE_KEY!, process.env.JWKS_PUBLIC_KEYS!]);

    await app.register(helmet);
    await app.register(cookie, {
        secret: process.env.COOKIE_SECRET,
    } as FastifyCookieOptions);
    await app.register(jwtStatelessSession, {
        jwt: {
            issuer: process.env.JWT_ISSUER!,
            audience: process.env.JWT_AUDIENCE!,
            sign: {
                key: JSON.parse(privateKey.Value!),
                algorithm: AuthConfig.JWT_ALGORITHM,
                expiresIn: "2h",
            },
            verify: {
                keys: JSON.parse(publicKeys.Value!),
                algorithms: [AuthConfig.JWT_ALGORITHM],
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
        if (USE_METADATA_SERVICE) {
            await MetadataService.initialize().then(() => {
                console.debug("🔐 MetadataService initialized");
            });
        }

        dynamoose.aws.ddb.local(process.env.AWS_DYNAMODB_ENDPOINT);

        // new dynamoose.aws.ddb.DynamoDB({
        //     endpoint: process.env.AWS_DYNAMODB_ENDPOINT,
        //     region: process.env.AWS_REGION!,
        //     credentials: {
        //         accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        //         secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        //     },
        // });
    });

    return app;
};

if (!IS_PROD) {
    init().then((server) => {
        server.log.info("🚀 Starting server");
        return server.listen({ host: "0.0.0.0", port: parseInt(process.env.CONTAINER_PORT ?? "9000", 10) }, (err) => {
            if (err) {
                server.log.error(err);
                process.exit(1);
            }
        });
    });
}

export { init };
export default init;
