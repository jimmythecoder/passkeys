import * as express from "express";
import dotenv from "dotenv";
import { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { UserModel, User, AuthChallenge } from "@/data/users";
import { Authenticator, AuthenticatorModel } from "@/data/authenticators";
import { UserNotFound, UserAlreadyExists, ChallengeError, AuthenticatorNotFound, CustomError, AuthenticatorMismatch } from "@/exceptions";

dotenv.config({ path: ".env.test" });

export const api = express.Router();

const RP_ORIGIN = `${process.env.HTTPS ? "https" : "http   "}://${process.env.RP_ID}:${process.env.RP_PROXY_PORT ?? "3001"}`;
const RP_ID = process.env.RP_ID ?? "localhost";
const RP_NAME = process.env.RP_NAME ?? "Passkeys Example";
const USE_METADATA_SERVICE = process.env.USE_METADATA_SERVICE === "true";

enum HttpStatusCode {
    OK = 200,
    Created = 201,
    BadRequest = 400,
    Unauthorized = 401,
    NotFound = 404,
}

api.get("/healthcheck", async (req, res) => {
    res.json({ status: "ok" });
});

api.post("/signin/new", async (req, res) => {
    try {
        const username = req.body.username as string;
        if (!username) {
            throw new Error("Username is required");
        }

        const [userEntity] = await UserModel.query("userName")
            .eq(username)
            .exec();

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

        const challenge = new AuthChallenge({challenge: options.challenge});

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

        const challenge = new AuthChallenge({challenge: options.challenge});

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
            throw new Error("Missing credential ID");
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

        const { verified } = verification;

        user.isVerified = verified;

        req.session.user = user;

        console.debug("User signed in", user);

        res.status(HttpStatusCode.OK).json(verified);
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

api.post("/register/new", async (req, res) => {
    try {
        const username = req.body.username as string;
        const displayName = req.body.displayName as string;

        if (!displayName) {
            throw new Error("Name is required");
        }

        if (!username) {
            throw new Error("Username is required");
        }

        const users = await UserModel.query("userName")
            .eq(username)
            .limit(1)
            .exec();

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
            // See "Guiding use of authenticators via authenticatorSelection" below
            authenticatorSelection: {
                // Defaults
                residentKey: "required",
                userVerification: "preferred",
                // Optional
                authenticatorAttachment: "platform",
            },
        });

        const challenge = new AuthChallenge({challenge: options.challenge});

        req.session.user = user;
        req.session.challenge = challenge;

        console.debug("New user registering", user, challenge);

        res.status(HttpStatusCode.OK).json(options);
    } catch (error) {
        if (error instanceof CustomError) {
            console.error(error.message);
            res.statusMessage = error.message;
            return res.status(error.code).json(error);
        }

        if (error instanceof Error) {
            console.error(error);
            res.statusMessage = error.message;
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

        const { verified } = verification;

        user.isVerified = verified;

        UserModel.create(user);

        req.session.user = user;

        console.debug("New user registered", user);

        if (verification.registrationInfo) {
            const newAuthenticator = new Authenticator({
                id: crypto.randomUUID(),
                userId: req.session.user.id,
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

        res.status(HttpStatusCode.Created).json(verified);
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
