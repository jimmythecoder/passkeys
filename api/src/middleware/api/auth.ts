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
import { isoBase64URL, isoUint8Array } from "@simplewebauthn/server/helpers";
import { UserModel, User } from "@/models/user";
import { UserSession } from "@/models/userSession";
import { AuthChallenge, SessionChallenge } from "@/models/challenge";
import { type Passkey, PasskeyModel } from "@/models/passkey";
import * as Exceptions from "@passkeys/exceptions";
import { schema } from "@/middleware/api/auth.schema";
import { Api as ApiConfig, Auth as AuthConfig } from "@passkeys/config";

const SESSION_LIFETIME = parseInt(process.env.SESSION_LIFETIME ?? "86400000", 10);
const RP_ORIGIN = process.env.RP_ORIGIN ?? "http://localhost:3000";
const RP_ID = process.env.RP_ID ?? "localhost";
const RP_NAME = process.env.RP_NAME ?? "canhazpasskey";
const USE_METADATA_SERVICE = process.env.USE_METADATA_SERVICE === "true";

function handleError(error: unknown, reply: FastifyReply) {
    if (error instanceof Exceptions.ApiException) {
        reply.log.error(error.toString());
        return reply.type("application/problem+json").status(error.status).send(error.toJSON());
    }

    if (error instanceof Error) {
        reply.log.error("[ERROR]", error.message);
        return reply.type("application/problem+json").status(Exceptions.ApiException.Status.InternalServerError).send(error);
    }

    reply.log.error("[ERROR]", error);
    return reply.type("application/problem+json").status(Exceptions.ApiException.Status.InternalServerError).send(error);
}

export const api: FastifyPluginCallback = (fastify, _, next) => {
    fastify.post("/signout", async (request, reply) => {
        try {
            request.session.delete();

            return await reply.status(ApiConfig.HttpStatusCode.NoContent).send({ message: "Signed out" });
        } catch (error) {
            return handleError(error, reply);
        }
    });

    fastify.delete("/session", async (request, reply) => {
        try {
            request.session.delete();

            return await reply.status(ApiConfig.HttpStatusCode.NoContent).send({ message: "Signed out" });
        } catch (error) {
            return handleError(error, reply);
        }
    });

    fastify.post<{ Body: FromSchema<typeof schema.request.signin.getCredentails> }>("/signin", async (request, reply) => {
        try {
            const { userName } = request.body;

            if (!userName) {
                throw new Exceptions.ValidationError("UserName is required");
            }

            const [userEntity] = await UserModel.query("userName").eq(userName).exec();

            if (!userEntity) {
                throw new Exceptions.UserNotFound(`User not found`);
            }

            const user = new User(userEntity);

            const userPasskeys = await PasskeyModel.query("userId").eq(user.id).exec();

            if (!userPasskeys.length) {
                throw new Exceptions.AuthenticatorNotFound(`User has no registered authenticators`);
            }

            if (user.isLocked) {
                throw new Exceptions.UserAccountLocked(`User is locked out`);
            }

            const options = await generateAuthenticationOptions({
                rpID: RP_ID,
                // Require users to use a previously-registered authenticator
                allowCredentials: userPasskeys.map((passkey) => ({
                    id: passkey.id,
                    name: passkey.webauthnUserID,
                    type: "public-key",
                    transports: passkey.transports,
                })),
                userVerification: "preferred",
            });

            const challenge = new AuthChallenge({
                challenge: options.challenge,
                authenticators: userPasskeys.map((passkey) => passkey.id),
            });

            request.log.info("User signing in", user.userName);
            request.session.set("sub", user.userName);
            request.session.set("challenge", challenge.toJSON());

            return await reply.status(ApiConfig.HttpStatusCode.OK).send(options);
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
                throw new Exceptions.ValidationError("No authenticators provided");
            }

            if (credentials.length > AuthConfig.MAX_AUTHENTICATORS) {
                throw new Exceptions.ValidationError("Too many authenticators provided, max 10");
            }

            const filter = new dynamoose.Condition().filter("credentialID").in(credentials);
            const userPasskeys = await PasskeyModel.scan(filter).exec();

            if (!userPasskeys.length) {
                throw new Exceptions.AuthenticatorNotFound(`No matching authenticators found`);
            }

            const userModel = await UserModel.get(userPasskeys[0].userId);
            const user = new User(userModel);

            if (!user) {
                throw new Exceptions.UserNotFound(`User not found`);
            }

            if (user.isLocked) {
                throw new Exceptions.UserAccountLocked(`User is locked out`);
            }

            const options = await generateAuthenticationOptions({
                rpID: RP_ID,
                allowCredentials: userPasskeys.map((passkey) => ({
                    id: passkey.id,
                    type: "public-key",
                    transports: passkey.transports,
                })),
                userVerification: "preferred",
            });

            const challenge = new AuthChallenge({
                challenge: options.challenge,
                authenticators: userPasskeys.map((passkey) => passkey.id),
            });

            request.log.debug("User signing in with Conditional UI", userPasskeys.map((passkey) => passkey.id).join(", "));

            request.session.set("challenge", challenge.toJSON());

            return await reply.status(ApiConfig.HttpStatusCode.OK).send(options);
        } catch (error) {
            return handleError(error, reply);
        }
    });

    fastify.post<{ Body: FromSchema<typeof schema.request.signin.verify> }>("/signin/verify", async (request, reply) => {
        try {
            const jwtToken = request.session.get<SessionChallenge>("challenge");

            if (!jwtToken) {
                throw new Exceptions.ValidationError("Missing auth token");
            }

            const credentialID = isoBase64URL.toBuffer(request.body.rawId);

            if (!credentialID) {
                throw new Exceptions.ValidationError("Missing credential ID");
            }

            const [passkey] = await PasskeyModel.query("credentialID").eq(credentialID).exec();

            if (!passkey) {
                throw new Exceptions.AuthenticatorMismatch(`Authenticator not found`);
            }

            // Is this authenticator the same as the one paired with the challenge?
            if (!jwtToken.authenticators.includes(passkey.id)) {
                throw new Exceptions.AuthenticatorMismatch(`Unknown authenticator used`);
            }

            const challenge = new AuthChallenge({ challenge: jwtToken.challenge });

            if (!challenge.currentChallenge) {
                throw new Exceptions.ChallengeError("Missing challenge, sign-in again");
            }

            const userModel = await UserModel.get(passkey.userId);

            if (!userModel) {
                throw new Exceptions.UserNotFound(`User not found`);
            }

            const user = new User(userModel);

            if (user.isLocked) {
                throw new Exceptions.UserAccountLocked(`User is locked out`);
            }

            try {
                const verification = await verifyAuthenticationResponse({
                    response: request.body,
                    expectedChallenge: challenge.currentChallenge,
                    expectedOrigin: RP_ORIGIN,
                    expectedRPID: RP_ID,
                    credential: {
                        id: passkey.id,
                        publicKey: passkey.publicKey,
                        counter: passkey.counter,
                        transports: passkey.transports,
                    },
                    requireUserVerification: true,
                });

                if (!verification.verified) {
                    throw new Exceptions.VerificationError("Verification failed");
                }
            } catch (error) {
                await UserModel.update({ id: user.id }, { failedLoginAttempts: user.failedLoginAttempts + 1 });
                throw new Exceptions.VerificationError("Verification failed");
            }

            request.log.debug("User verified", user.userName);

            const session = new UserSession({
                userId: user.id,
                issuedAt: Date.now(),
                expiresAt: Date.now() + SESSION_LIFETIME,
            });

            request.session.reset();
            request.session.set("sub", user.id);
            request.session.set("roles", user.roles);

            return await reply.status(ApiConfig.HttpStatusCode.Created).send({ user, session, passkey });
        } catch (error) {
            return await handleError(error, reply);
        } finally {
            // Prevent replay attacks with the same challenge
            request.session.set("challenge", undefined);
        }
    });

    fastify.post<{ Body: FromSchema<typeof schema.request.register.getCredentials> }>("/register", async (request, reply) => {
        try {
            const { userName, displayName, authenticatorName } = request.body;

            if (!displayName) {
                throw new Exceptions.ValidationError("Name is required", "displayName");
            }

            if (!userName) {
                throw new Exceptions.ValidationError("UserName is required", "userName");
            }

            const users = await UserModel.query("userName").eq(userName).limit(1).exec();

            if (users.length) {
                throw new Exceptions.UserAlreadyExists(`User ${userName} already exists`);
            }

            const user = new User({
                userName,
                displayName,
            });

            const userPasskeys = [] as Passkey[];

            const options = await generateRegistrationOptions({
                rpName: RP_NAME,
                rpID: RP_ID,
                userID: isoUint8Array.fromUTF8String(user.id),
                userName,
                // Don't prompt users for additional information about the authenticator
                // (Recommended for smoother UX)
                attestationType: USE_METADATA_SERVICE ? "direct" : "none",
                // Prevent users from re-registering existing authenticators
                excludeCredentials: userPasskeys.map((passkey) => ({
                    id: passkey.id,
                    type: "public-key",
                    // Optional
                    transports: passkey.transports,
                })),
                authenticatorSelection: {
                    residentKey: "preferred",

                    /**
                     * Verify the user is present via a biometric sensor (TouchID, FaceID, Windows Hello, etc.)
                     */
                    userVerification: "preferred", // Prefer authenticators with biometric sensors

                    /**
                     * Require authenticators with a built-in platform authenticator (TouchID, FaceID, Windows Hello, etc.) or external authenticator (YubiKey, etc.)
                     * @default none (no platform authenticator required, both can be used)
                     */
                    // authenticatorAttachment: "cross-platform",
                },
            });

            const challenge = new AuthChallenge({ challenge: options.challenge });

            request.session.set("user", user);
            request.session.set("challenge", challenge);

            request.log.debug("New user registration request", user.userName);

            return await reply.status(ApiConfig.HttpStatusCode.OK).send(options);
        } catch (error) {
            return handleError(error, reply);
        }
    });

    fastify.post<{ Body: FromSchema<typeof schema.request.register.verify> }>("/register/verify", async (request, reply) => {
        try {
            const user = new User(request.session.get("user"));
            const challenge = new AuthChallenge(request.session.get("challenge"));

            if (!challenge.isValid()) {
                throw new Exceptions.ChallengeError("Challenge not found or expired, re-register");
            }

            const verification = await verifyRegistrationResponse({
                response: request.body.attResp,
                expectedChallenge: challenge.challenge,
                expectedOrigin: RP_ORIGIN,
                expectedRPID: RP_ID,
                requireUserVerification: true,
            });

            if (!verification.verified) {
                throw new Exceptions.VerificationError("Verification failed");
            }

            if (!verification.registrationInfo) {
                throw new Exceptions.VerificationError("Missing registration info");
            }

            await UserModel.create(user);

            const passkey = await PasskeyModel.create({
                id: crypto.randomUUID(),
                userId: user.id,
                webauthnUserID: verification.registrationInfo.credential.id,
                publicKey: Buffer.from(verification.registrationInfo.credential.publicKey),
                counter: verification.registrationInfo.credential.counter,
                deviceType: verification.registrationInfo.credentialDeviceType,
                backedUp: verification.registrationInfo.credentialBackedUp,
                transports: request.body.attResp.response.transports,
            });

            const session = new UserSession({
                userId: user.id,
                issuedAt: Date.now(),
                expiresAt: Date.now() + SESSION_LIFETIME,
            });

            request.session.reset();
            request.session.set("sub", user.id);
            request.session.set("roles", user.roles);

            request.log.debug("New user registered", user.userName);

            return await reply
                .status(ApiConfig.HttpStatusCode.Created)
                .send({ user, session, credentialID: Buffer.from(passkey.webauthnUserID).toString("base64") });
        } catch (error) {
            return await handleError(error, reply);
        } finally {
            request.session.set("challenge", undefined);
        }
    });

    next();
};

export default api;
