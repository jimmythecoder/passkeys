import Fastify from "fastify";
import helmet from "@fastify/helmet";
import session from "@fastify/secure-session";
import { SSMClient, GetParametersCommand } from "@aws-sdk/client-ssm";
import dotenv from "dotenv";
import { MetadataService } from "@simplewebauthn/server";
import dynamoose from "dynamoose";
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

        // Get SSM paramters from AWS
        const ssm = new SSMClient({ region: process.env.AWS_REGION });
        const cmd = new GetParametersCommand({
            Names: [process.env.JWK_PRIVATE_KEY!, process.env.JWK_PUBLIC_KEY!],
            WithDecryption: true,
        });

        const data = await ssm.send(cmd);

        if (!data.Parameters) {
            throw new Error("No private key found");
        }

        const [privateKey, publicKey] = data.Parameters;

        const jwks = {
            public: JSON.parse(Buffer.from(publicKey.Value!, "hex").toString("utf8")),
            private: JSON.parse(Buffer.from(privateKey.Value!, "hex").toString("utf8")),
            issuer: process.env.JWT_ISSUER,
            audience: process.env.JWT_AUDIENCE,
        };

        app.decorate("jwks", jwks);
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
