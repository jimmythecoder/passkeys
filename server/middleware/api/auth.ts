import * as express from "express";
import dotenv from "dotenv";
import { expressjwt, Request as JWTRequest } from "express-jwt";
import jwt from "jsonwebtoken";
import { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { UserModel, User, UserType, AuthChallenge } from "@/models/users";
import { Authenticator, AuthenticatorModel } from "@/models/authenticators";
import { UserNotFound, UserAlreadyExists, ValidationError, VerificationError, ChallengeError, AuthenticatorNotFound, CustomError, AuthenticatorMismatch } from "@/util/exceptions";
import { HttpStatusCode } from "@/util/constants";

dotenv.config();

export const api = express.Router();

const IS_HTTPS = process.env.HTTPS === "true";
const TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET ?? "catfish";
const TOKEN_EXPIRATION = process.env.AUTH_TOKEN_EXPIRATION ?? "1h";
const TOKEN_ALGORITHIMS = [(process.env.TOKEN_ALGORITHIM as jwt.Algorithm) ?? "HS256"] satisfies jwt.Algorithm[];
const RP_ORIGIN = `${IS_HTTPS ? "https" : "http"}://${process.env.RP_ID}:${process.env.RP_PROXY_PORT ?? "3000"}`;
const RP_ID = process.env.RP_ID ?? "localhost";
const RP_NAME = process.env.RP_NAME ?? "Passkeys Example";
const USE_METADATA_SERVICE = process.env.USE_METADATA_SERVICE === "true";

const jwtAuthorizer = expressjwt({ secret: TOKEN_SECRET, algorithms: TOKEN_ALGORITHIMS });

api.post("/signout", jwtAuthorizer, async (req: JWTRequest<UserType>, res) => {
    try {
        req.session.destroy((error: string) => {
            if (error) {
                throw new Error(error);
            }

            res.json({ status: "ok" });
        });
    } catch (error) {
        if (error instanceof CustomError) {
            console.error("Not signed in", error.message);
            res.statusMessage = error.name;
            return res.status(error.code).json(error);
        }

        console.error(error);
        return res.status(HttpStatusCode.Unauthorized).json(error);
    }
});

api.post("/signin", async (req, res) => {
    try {
        const username = req.body.username as string;
        if (!username) {
            throw new ValidationError("Username is required");
        }

        const [userEntity] = await UserModel.query("userName").eq(username).exec();

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

        req.session.user = user;
        req.session.challenge = challenge;

        console.debug("User signing in", req.session.user);

        res.status(HttpStatusCode.OK).json(options);
    } catch (error) {
        if (error instanceof CustomError) {
            console.error(error);
            res.statusMessage = error.name;
            return res.status(error.code).json(error);
        }

        if (error instanceof Error) {
            console.error(error);
            return res.status(HttpStatusCode.BadRequest).json(error);
        }

        console.error(error);
        return res.status(HttpStatusCode.BadRequest).json(error);
    }
});

api.get("/signin/passkey", async (req, res) => {
    try {
        const user = new User();

        const options = await generateAuthenticationOptions({
            rpID: RP_ID,
            userVerification: "preferred",
        });

        const challenge = new AuthChallenge({ challenge: options.challenge });

        req.session.user = user;
        req.session.challenge = challenge;

        console.debug("User signing in", req.session.user);

        res.status(HttpStatusCode.OK).json(options);
    } catch (error) {
        if (error instanceof CustomError) {
            console.error(error);
            res.statusMessage = error.name;
            return res.status(error.code).json(error);
        }

        if (error instanceof Error) {
            console.error(error);
            return res.status(HttpStatusCode.BadRequest).json(error);
        }

        console.error(error);
        return res.status(HttpStatusCode.BadRequest).json(error);
    }
});

api.post("/signin/verify", async (req, res) => {
    try {
        if (!req.session.user) {
            throw new UserNotFound("User not found");
        }

        const user = new User(req.session.user);
        const challenge = new AuthChallenge(req.session.challenge);

        if (!challenge.currentChallenge) {
            throw new ChallengeError("Missing challenge, sign-in again");
        }

        const credentialID = isoBase64URL.toBuffer(req.body.rawId);

        if (!credentialID) {
            throw new ValidationError("Missing credential ID");
        }

        const [authenticator] = await AuthenticatorModel.query("credentialID").eq(credentialID).and().where("userId").eq(user.id).exec();

        if (!authenticator) {
            throw new AuthenticatorMismatch(`Authenticator not found for userID`);
        }

        console.debug("Authenticator found", authenticator);

        const verification = await verifyAuthenticationResponse({
            response: req.body,
            expectedChallenge: challenge.currentChallenge,
            expectedOrigin: RP_ORIGIN,
            expectedRPID: RP_ID,
            authenticator,
            requireUserVerification: true,
        });

        if (!verification.verified) {
            throw new VerificationError("Verification failed");
        }

        req.session.user = user;

        console.debug("User signed in", user);

        const token = jwt.sign({ ...user }, TOKEN_SECRET, {
            expiresIn: TOKEN_EXPIRATION,
        });

        res.status(HttpStatusCode.Created).json({ token });
    } catch (error) {
        if (error instanceof CustomError) {
            console.error(error);
            res.statusMessage = error.name;
            return res.status(error.code).json(error);
        }

        if (error instanceof Error) {
            console.error(error);
            return res.status(HttpStatusCode.BadRequest).json({ message: "Invalid signature" });
        }

        console.error(error);
        return res.status(HttpStatusCode.BadRequest).json({ message: "Unknown error" });
    } finally {
        // Prevent replay attacks with the same challenge
        delete req.session.user.challenge;
    }
});

api.post("/register", async (req, res) => {
    try {
        const username = req.body.username as string;
        const displayName = req.body.displayName as string;

        if (!displayName) {
            throw new ValidationError("Name is required");
        }

        if (!username) {
            throw new ValidationError("Username is required");
        }

        const users = await UserModel.query("userName").eq(username).limit(1).exec();

        if (users.length) {
            throw new UserAlreadyExists(`User ${username} already exists`);
        }

        const user = new User({
            userName: username,
            displayName: displayName,
        });

        const userAuthenticators = [] as Authenticator[];

        const options = await generateRegistrationOptions({
            rpName: RP_NAME,
            rpID: RP_ID,
            userID: user.id,
            userName: user.userName,
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

        req.session.user = user;
        req.session.challenge = challenge;

        console.debug("New user registering", user, challenge);

        res.status(HttpStatusCode.OK).json(options);
    } catch (error) {
        if (error instanceof CustomError) {
            console.error(error.message);
            res.statusMessage = error.name;
            return res.status(error.code).json(error);
        }

        if (error instanceof Error) {
            console.error(error);
            return res.status(HttpStatusCode.BadRequest).json(error);
        }

        console.error(error);
        return res.status(HttpStatusCode.BadRequest).json(error);
    }
});

api.post("/register/verify", async (req, res) => {
    try {
        const user = new User(req.session.user);
        const challenge = new AuthChallenge(req.session.challenge);

        if (!challenge.isValid()) {
            throw new ChallengeError("Challenge not found or expired, re-register");
        }

        const verification = await verifyRegistrationResponse({
            response: req.body,
            expectedChallenge: challenge.challenge,
            expectedOrigin: RP_ORIGIN,
            expectedRPID: RP_ID,
            requireUserVerification: true,
        });

        if (!verification.verified) {
            throw new VerificationError("Verification failed");
        }

        UserModel.create(user);

        req.session.user = user;

        console.debug("New user registered", user);

        if (verification.registrationInfo) {
            const newAuthenticator = new Authenticator({
                id: crypto.randomUUID(),
                userId: user.id,
                credentialID: Buffer.from(verification.registrationInfo.credentialID),
                credentialPublicKey: Buffer.from(verification.registrationInfo.credentialPublicKey),
                counter: verification.registrationInfo.counter,
                credentialDeviceType: verification.registrationInfo.credentialDeviceType,
                credentialBackedUp: verification.registrationInfo.credentialBackedUp,
                transports: req.body.response.transports,
            });

            AuthenticatorModel.create(newAuthenticator);

            console.debug("New authenticator registered", newAuthenticator);
        }

        const token = jwt.sign({ ...user }, TOKEN_SECRET, {
            expiresIn: TOKEN_EXPIRATION,
        });

        res.status(HttpStatusCode.Created).json({ token });
    } catch (error) {
        if (error instanceof CustomError) {
            console.error(error);
            res.statusMessage = error.name;
            return res.status(error.code).json(error);
        }

        if (error instanceof Error) {
            console.error(error);
            return res.status(HttpStatusCode.BadRequest).json(error);
        }

        console.error(error);
        return res.status(HttpStatusCode.BadRequest).json(error);
    } finally {
        delete req.session.user.challenge;
    }
});
