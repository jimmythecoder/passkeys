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
import { sign, encrypt } from "@/util/jwt";
import { UserModel, User } from "@/models/user";
import { UserSession } from "@/models/userSession";
import { AuthChallenge } from "@/models/challenge";
import { Authenticator, AuthenticatorModel } from "@/models/authenticators";
import * as Exceptions from "@/exceptions";
import { HttpStatusCode } from "@/constants";
import { schema } from "@/middleware/api/auth.schema";

dotenv.config();

const SESSION_LIFETIME = parseInt(process.env.SESSION_LIFETIME ?? "86400000", 10);
const RP_ORIGIN = process.env.RP_ORIGIN ?? "http://localhost:3000";
const RP_ID = process.env.RP_ID ?? "localhost";
const RP_NAME = process.env.RP_NAME ?? "canhazpasskey";
const USE_METADATA_SERVICE = process.env.USE_METADATA_SERVICE === "true";

function handleError(error: unknown, reply: FastifyReply) {
    if (error instanceof Exceptions.Exception) {
        console.error(error.toString());
        return reply.status(error.code).send(error.toJSON());
    }

    if (error instanceof Error) {
        console.error("[ERROR]", error.message);
        return reply.status(HttpStatusCode.BadRequest).send(error);
    }

    console.error("[ERROR]", error);
    return reply.status(HttpStatusCode.BadRequest).send(error);
}

export const api: FastifyPluginCallback = (fastify, _, next) => {
    fastify.post("/signout", async (request, reply) => {
        try {
            request.session.delete();

            return await reply.status(HttpStatusCode.NoContent).send({ message: "Signed out" });
        } catch (error) {
            return handleError(error, reply);
        }
    });

    fastify.delete("/session", async (request, reply) => {
        try {
            request.session.delete();

            return await reply.status(HttpStatusCode.NoContent).send({ message: "Signed out" });
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

            const userAuthenticators = await AuthenticatorModel.query("userId").eq(user.id).exec();

            if (!userAuthenticators.length) {
                throw new Exceptions.AuthenticatorNotFound(`User has no registered authenticators`);
            }

            if (user.isLocked) {
                throw new Exceptions.UserAccountLocked(`User is locked out`);
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

            const jwt = await sign({ sub: user.userName, challenge: challenge.challenge }, fastify.jwks.private, {
                issuer: fastify.jwks.issuer,
                audience: fastify.jwks.audience,
                expiration: challenge.expires / 1000,
            });

            reply.setCookie("jwt", jwt, {
                path: "/",
                httpOnly: true,
                secure: false,
                sameSite: "strict",
                expires: new Date(challenge.expires),
            });

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
                throw new Exceptions.ValidationError("No authenticators provided");
            }

            const filter = new dynamoose.Condition().filter("credentialID").in(credentials);
            const userAuthenticators = await AuthenticatorModel.scan(filter).exec();

            if (!userAuthenticators.length) {
                throw new Exceptions.AuthenticatorNotFound(`No matching authenticators found`);
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
            const userSession = request.session.get("user") as User;

            if (!userSession) {
                throw new Exceptions.UserNotFound("User not found");
            }

            const userId = userSession.id;
            const challenge = new AuthChallenge(request.session.get("challenge"));

            if (!challenge.currentChallenge) {
                throw new Exceptions.ChallengeError("Missing challenge, sign-in again");
            }

            const credentialID = isoBase64URL.toBuffer(request.body.rawId);

            if (!credentialID) {
                throw new Exceptions.ValidationError("Missing credential ID");
            }

            const [authenticator] = await AuthenticatorModel.query("credentialID").eq(credentialID).and().where("userId").eq(userId).exec();

            if (!authenticator) {
                throw new Exceptions.AuthenticatorMismatch(`Authenticator not found for userID`);
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
                throw new Exceptions.VerificationError("Verification failed");
            }

            const user = await UserModel.get(authenticator.userId);

            request.session.set("user", user);
            request.session.set("isSignedIn", true);

            console.debug("User verified", user.userName);

            const session = new UserSession({
                userId: user.id,
                issuedAt: Date.now(),
                expiresAt: Date.now() + SESSION_LIFETIME,
            });

            return await reply.status(HttpStatusCode.Created).send({ user, session });
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
                    residentKey: "preferred",

                    /**
                     * Verify the user is present via a biometric sensor (TouchID, FaceID, Windows Hello, etc.)
                     */
                    userVerification: "preferred", // Prefer authenticators with biometric sensors

                    /**
                     * Passkeys require a resident key to be stored on the authenticator that is multi-device compatible e.g. not a Yuibkey
                     * @value platform: Use built-in authenticators, typically a laptop or phone with a TPM chip or Secure Enclave, it will use TouchID, FaceID, or Windows Hello
                     * @value cross-platform: Prefer authenticators without a resident key, but allow authenticators with one, typically a USB Key
                     */
                    // authenticatorAttachment: "cross-platform", // Passkey
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
                throw new Exceptions.ChallengeError("Challenge not found or expired, re-register");
            }

            const verification = await verifyRegistrationResponse({
                response: request.body,
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
