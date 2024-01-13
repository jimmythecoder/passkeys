import dotenv from "dotenv";
import type { FastifyPluginCallback, FastifyReply } from "fastify";
import { FromSchema } from "json-schema-to-ts";
import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import dynamoose from "dynamoose";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { UserModel, User } from "@/models/user";
import { UserSession } from "@/models/userSession";
import { AuthChallenge } from "@/models/challenge";
import { Authenticator, AuthenticatorModel } from "@/models/authenticators";
import {
    UserNotFound,
    UserAlreadyExists,
    ValidationError,
    VerificationError,
    ChallengeError,
    AuthenticatorNotFound,
    CustomError,
    AuthenticatorMismatch,
} from "@/util/exceptions";
import { HttpStatusCode } from "@/util/constants";

dotenv.config();

const IS_HTTPS = process.env.HTTPS === "true";
const SESSION_LIFETIME = parseInt(process.env.SESSION_LIFETIME ?? "0", 10) || 86400000;
const RP_ORIGIN = `${IS_HTTPS ? "https" : "http"}://${process.env.RP_ID}:${process.env.RP_PROXY_PORT ?? "3000"}`;
const RP_ID = process.env.RP_ID ?? "localhost";
const RP_NAME = process.env.RP_NAME ?? "Passkeys Example";
const USE_METADATA_SERVICE = process.env.USE_METADATA_SERVICE === "true";

function handleError(error: unknown, reply: FastifyReply) {
    if (error instanceof CustomError) {
        console.error(error.toString());
        return reply.status(error.code).send(error);
    }

    if (error instanceof Error) {
        console.error("[ERROR]", error.message);
        return reply.status(HttpStatusCode.BadRequest).send(error);
    }

    console.error("[ERROR]", error);
    return reply.status(HttpStatusCode.BadRequest).send(error);
}

const schema = {
    request: {
        signin: {
            getCredentails: {
                type: "object",
                properties: {
                    /**
                     * Users can sign in with a username or email address
                     */
                    userName: { type: "string" },
                },
                required: ["username"],
            },
            passkey: {
                type: "object",
                properties: {
                    /**
                     * Autenticator ids
                     */
                    authenticators: { type: "array", items: { type: "string" } },
                },
                required: ["authenticators"],
            },
            verify: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    rawId: { type: "string" },
                    response: {
                        type: "object",
                        properties: {
                            clientDataJSON: { type: "string" },
                            authenticatorData: { type: "string" },
                            signature: { type: "string" },
                            userHandle: { type: "string" },
                        },
                        required: ["clientDataJSON", "authenticatorData", "signature"],
                    },
                    authenticatorAttachment: { enum: ["cross-platform", "platform"] },
                    clientExtensionResults: {
                        type: "object",
                        properties: {
                            appid: { type: "boolean" },
                            credProps: {
                                type: "object",
                                properties: {
                                    rk: { type: "boolean" },
                                },
                            },
                            hmacCreateSecret: { type: "boolean" },
                        },
                        required: [],
                    },
                    type: { enum: ["public-key"] },
                },
                required: ["rawId", "id", "response", "clientExtensionResults", "type"],
            },
        },
        register: {
            getCredentials: {
                type: "object",
                properties: {
                    userName: { type: "string" },
                    displayName: { type: "string" },
                },
                required: ["username", "displayName"],
            },
            verify: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    rawId: { type: "string" },
                    response: {
                        type: "object",
                        properties: {
                            clientDataJSON: { type: "string" },
                            attestationObject: { type: "string" },
                            authenticatorData: { type: "string" },
                            transports: { type: "array", items: { enum: ["ble", "hybrid", "internal", "nfc", "usb"] } },
                            publicKeyAlgorithm: { type: "number" },
                            publicKey: { type: "string" },
                        },
                        required: ["clientDataJSON", "attestationObject"],
                    },
                    authenticatorAttachment: { enum: ["cross-platform", "platform"] },
                    clientExtensionResults: {
                        type: "object",
                        properties: {
                            appid: { type: "boolean" },
                            credProps: {
                                type: "object",
                                properties: {
                                    rk: { type: "boolean" },
                                },
                            },
                            hmacCreateSecret: { type: "boolean" },
                        },
                        required: [],
                    },
                    type: { enum: ["public-key"] },
                },
                required: ["rawId", "id", "response", "clientExtensionResults", "type"],
            },
        },
    },
} as const;

export const api: FastifyPluginCallback = (fastify, _, next) => {
    fastify.get("/signout", (request, reply) => {
        try {
            return request.session.delete();
        } catch (error) {
            return handleError(error, reply);
        }
    });

    fastify.post<{ Body: FromSchema<typeof schema.request.signin.getCredentails> }>("/signin", async (request, reply) => {
        try {
            const { userName } = request.body;

            if (!userName) {
                throw new ValidationError("UserName is required");
            }

            const [userEntity] = await UserModel.query("userName").eq(userName).exec();

            if (!userEntity) {
                throw new UserNotFound(`User not found`);
            }

            const user = new User(userEntity);

            const userAuthenticators = await AuthenticatorModel.query("userId").eq(user.id).exec();

            if (!userAuthenticators.length) {
                throw new AuthenticatorNotFound(`User has no registered authenticators`);
            }

            const options = await generateAuthenticationOptions({
                rpID: RP_ID,
                // Require users to use a previously-registered authenticator
                allowCredentials: userAuthenticators.map((authenticator) => ({
                    id: authenticator.credentialID,
                    type: "public-key",
                    transports: authenticator.transports,
                })),
                userVerification: "preferred",
            });

            const challenge = new AuthChallenge({ challenge: options.challenge });

            request.session.set("user", user);
            request.session.set("challenge", challenge);

            console.debug("User signing in", user.userName);

            return await reply.status(HttpStatusCode.OK).send(options);
        } catch (error) {
            return handleError(error, reply);
        }
    });

    fastify.post<{ Body: FromSchema<typeof schema.request.signin.passkey> }>("/signin/passkey", async (request, reply) => {
        try {
            const credentials = (request.body.authenticators ?? []).map((cred) => {
                return isoBase64URL.toBuffer(cred);
            });

            if (!credentials || !credentials.length) {
                throw new ValidationError("No authenticators provided");
            }

            const filter = new dynamoose.Condition().filter("credentialID").in(credentials);
            const userAuthenticators = await AuthenticatorModel.scan(filter).exec();

            if (!userAuthenticators.length) {
                throw new AuthenticatorNotFound(`No matching authenticators found`);
            }

            const options = await generateAuthenticationOptions({
                rpID: RP_ID,
                allowCredentials: userAuthenticators.map((authenticator) => ({
                    id: authenticator.credentialID,
                    type: "public-key",
                    transports: authenticator.transports,
                })),
                userVerification: "preferred",
            });

            const challenge = new AuthChallenge({ challenge: options.challenge });

            request.session.set("user", new User({ id: userAuthenticators[0].userId }));
            request.session.set("challenge", challenge);

            console.debug("User signing in with Conditional UI", userAuthenticators[0].userId);

            return await reply.status(HttpStatusCode.OK).send(options);
        } catch (error) {
            return handleError(error, reply);
        }
    });

    fastify.post<{ Body: FromSchema<typeof schema.request.signin.verify> }>("/signin/verify", async (request, reply) => {
        try {
            const user = request.session.get("user") as User;

            if (!user) {
                throw new UserNotFound("User not found");
            }

            const userId = user.id;
            const challenge = new AuthChallenge(request.session.get("challenge"));

            if (!challenge.currentChallenge) {
                throw new ChallengeError("Missing challenge, sign-in again");
            }

            const credentialID = isoBase64URL.toBuffer(request.body.rawId);

            if (!credentialID) {
                throw new ValidationError("Missing credential ID");
            }

            const [authenticator] = await AuthenticatorModel.query("credentialID").eq(credentialID).and().where("userId").eq(userId).exec();

            if (!authenticator) {
                throw new AuthenticatorMismatch(`Authenticator not found for userID`);
            }

            const verification = await verifyAuthenticationResponse({
                response: request.body,
                expectedChallenge: challenge.currentChallenge,
                expectedOrigin: RP_ORIGIN,
                expectedRPID: RP_ID,
                authenticator,
                requireUserVerification: true,
            });

            if (!verification.verified) {
                throw new VerificationError("Verification failed");
            }

            const userModel = await UserModel.get(authenticator.userId);

            request.session.set("user", userModel);
            request.session.set("isSignedIn", true);

            console.debug("User verified", userModel.userName);

            const session = new UserSession({
                userId: userModel.id,
                issuedAt: Date.now(),
                expiresAt: Date.now() + SESSION_LIFETIME,
            });

            return await reply.status(HttpStatusCode.Created).send({ userModel, session });
        } catch (error) {
            return await handleError(error, reply);
        } finally {
            // Prevent replay attacks with the same challenge
            request.session.set("challenge", undefined);
        }
    });

    fastify.post<{ Body: FromSchema<typeof schema.request.register.getCredentials> }>("/register", async (request, reply) => {
        try {
            const { userName, displayName } = request.body;

            if (!displayName) {
                throw new ValidationError("Name is required", "displayName");
            }

            if (!userName) {
                throw new ValidationError("UserName is required", "userName");
            }

            const users = await UserModel.query("userName").eq(userName).limit(1).exec();

            if (users.length) {
                throw new UserAlreadyExists(`User ${userName} already exists`);
            }

            const user = new User({
                userName,
                displayName,
            });

            const userAuthenticators = [] as Authenticator[];

            const options = await generateRegistrationOptions({
                rpName: RP_NAME,
                rpID: RP_ID,
                userID: user.id,
                userName,
                // Don't prompt users for additional information about the authenticator
                // (Recommended for smoother UX)
                attestationType: USE_METADATA_SERVICE ? "direct" : "none",
                // Prevent users from re-registering existing authenticators
                excludeCredentials: userAuthenticators.map((authenticator) => ({
                    id: authenticator.credentialID,
                    type: "public-key",
                    // Optional
                    transports: authenticator.transports,
                })),
                authenticatorSelection: {
                    // Require authenticators with a resident key (built into to laptop / phone)
                    residentKey: "required",

                    /**
                     * Verify the user is present via a biometric sensor (TouchID, FaceID, Windows Hello, etc.)
                     */
                    userVerification: "preferred", // Prefer authenticators with biometric sensors

                    /**
                     * Passkeys require a resident key to be stored on the authenticator that is multi-device compatible e.g. not a Yuibkey
                     * @value platform: Use built-in authenticators, typically a laptop or phone with a TPM chip or Secure Enclave, it will use TouchID, FaceID, or Windows Hello
                     * @value cross-platform: Prefer authenticators without a resident key, but allow authenticators with one, typically a USB Key
                     */
                    authenticatorAttachment: "platform", // Passkey
                },
            });

            const challenge = new AuthChallenge({ challenge: options.challenge });

            request.session.set("user", user);
            request.session.set("challenge", challenge);

            console.debug("New user registration request", user.userName);

            return await reply.status(HttpStatusCode.OK).send(options);
        } catch (error) {
            return handleError(error, reply);
        }
    });

    fastify.post<{ Body: FromSchema<typeof schema.request.register.verify> }>("/register/verify", async (request, reply) => {
        try {
            const user = new User(request.session.get("user"));
            const challenge = new AuthChallenge(request.session.get("challenge"));

            if (!challenge.isValid()) {
                throw new ChallengeError("Challenge not found or expired, re-register");
            }

            const verification = await verifyRegistrationResponse({
                response: request.body,
                expectedChallenge: challenge.challenge,
                expectedOrigin: RP_ORIGIN,
                expectedRPID: RP_ID,
                requireUserVerification: true,
            });

            if (!verification.verified) {
                throw new VerificationError("Verification failed");
            }

            if (!verification.registrationInfo) {
                throw new VerificationError("Missing registration info");
            }

            await UserModel.create(user);

            const authenticator = await AuthenticatorModel.create({
                id: crypto.randomUUID(),
                userId: user.id,
                credentialID: Buffer.from(verification.registrationInfo.credentialID),
                credentialPublicKey: Buffer.from(verification.registrationInfo.credentialPublicKey),
                counter: verification.registrationInfo.counter,
                credentialDeviceType: verification.registrationInfo.credentialDeviceType,
                credentialBackedUp: verification.registrationInfo.credentialBackedUp,
                transports: request.body.response.transports,
            });

            const session = new UserSession({
                userId: user.id,
                issuedAt: Date.now(),
                expiresAt: Date.now() + SESSION_LIFETIME,
            });

            request.session.set("user", user);
            request.session.set("isSignedIn", true);

            console.debug("New user registered", user.userName);

            return await reply
                .status(HttpStatusCode.Created)
                .send({ user, session, credentialID: Buffer.from(authenticator.credentialID).toString("base64") });
        } catch (error) {
            return await handleError(error, reply);
        } finally {
            request.session.set("challenge", undefined);
        }
    });

    next();
};

export default api;
