import * as express from "express";
import dotenv from "dotenv";
import { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } from "@simplewebauthn/server";
import { users, UserModel } from "@/data/users";
import { authenticators, Authenticator } from "@/data/authenticators";
import { UserNotFound, UserAlreadyExists, AuthenticatorNotFound, CustomError } from "@/exceptions";

dotenv.config({ path: ".env.test" });

export const api = express.Router();

const RP_ORIGIN = `${process.env.HTTPS ? "https" : "http   "}://${process.env.RP_ID}:${process.env.RP_PROXY_PORT ?? "3001"}`;
const RP_ID = process.env.RP_ID ?? "localhost";
const RP_NAME = process.env.RP_NAME ?? "Passkeys Example";

api.get("/healthcheck", async (req, res) => {
    res.json({ status: "ok" });
});

api.get("/signin/new", async (req, res) => {
    try {
        if (!req.query.username) {
            throw new Error("Username is required");
        }

        const user = users.find((user) => user.userName === req.query.username);

        if (!user) {
            throw new UserNotFound(`User not found`);
        }

        const userAuthenticators = authenticators.filter((authenticator) => authenticator.userId === user.id);

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

        user.currentChallenge = options.challenge;

        req.session.user = user;

        console.debug("User signing in", req.session.user);

        res.json(options);
    } catch (error) {
        if (error instanceof CustomError) {
            console.error(error);
            res.statusMessage = error.name;
            return res.status(error.code).json(error);
        }

        if (error instanceof Error) {
            console.error(error);
            return res.status(400).json(error);
        }

        console.error(error);
        return res.status(400).json(error);
    }
});

api.post("/signin/verify", async (req, res) => {
    try {
        if (!req.session.user) {
            throw new UserNotFound("User not found");
        }

        if (!req.session.user?.currentChallenge) {
            throw new Error("User missing expected challenge, sign-in again");
        }

        const authenticator = authenticators.find((authenticator) => authenticator.userId === req.session.user.id);

        if (!authenticator) {
            throw new AuthenticatorNotFound(`User has no registered authenticators`);
        }

        const verification = await verifyAuthenticationResponse({
            response: req.body,
            expectedChallenge: req.session.user.currentChallenge,
            expectedOrigin: RP_ORIGIN,
            expectedRPID: RP_ID,
            authenticator,
        });

        const { verified } = verification;

        req.session.user.isVerified = verified;

        console.debug("User signed in", req.session.user);

        res.json(verified);
    } catch (error) {
        if (error instanceof CustomError) {
            console.error(error);
            res.statusMessage = error.name;
            return res.status(error.code).json(error);
        }

        if (error instanceof Error) {
            console.error(error);
            return res.status(400).json(error);
        }

        console.error(error);
        return res.status(400).json(error);
    }
});

api.get("/register/new", async (req, res) => {
    try {
        const username = req.query.username;

        if (!username) {
            throw new Error("Username is required");
        }

        if (users.find((user) => user.userName === username)) {
            throw new UserAlreadyExists(`User ${username} already exists`);
        }

        const user = {
            id: crypto.randomUUID(),
            userName: username,
            displayName: username,
            isVerified: false,
        } as UserModel;

        const userAuthenticators = authenticators.filter((authenticator) => authenticator.userId === user.id);

        const options = await generateRegistrationOptions({
            rpName: RP_NAME,
            rpID: RP_ID,
            userID: user.id,
            userName: user.userName,
            // Don't prompt users for additional information about the authenticator
            // (Recommended for smoother UX)
            attestationType: "none",
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
                residentKey: "preferred",
                userVerification: "preferred",
                // Optional
                authenticatorAttachment: "platform",
            },
        });

        user.currentChallenge = options.challenge;

        req.session.user = user;

        console.debug("New user registering", req.session.user);

        res.json(options);
    } catch (error) {
        if (error instanceof CustomError) {
            console.error(error.message);
            res.statusMessage = error.message;
            return res.status(error.code).json(error);
        }

        if (error instanceof Error) {
            console.error(error);
            res.statusMessage = error.message;
            return res.status(400).json(error);
        }

        console.error(error);
        return res.status(400).json(error);
    }
});

api.post("/register/verify", async (req, res) => {
    try {
        if (!req.session.user?.currentChallenge) {
            throw new Error("User msising expected challenge, please re-register.");
        }

        const verification = await verifyRegistrationResponse({
            response: req.body,
            expectedChallenge: req.session.user.currentChallenge,
            expectedOrigin: RP_ORIGIN,
            expectedRPID: RP_ID,
        });

        const { verified } = verification;

        req.session.user.isVerified = verified;

        users.push(req.session.user);

        console.debug("New user registered", req.session.user);

        if (verification.registrationInfo) {
            const newAuthenticator: Authenticator = {
                id: crypto.randomUUID(),
                userId: req.session.user.id,
                credentialID: verification.registrationInfo.credentialID,
                credentialPublicKey: verification.registrationInfo.credentialPublicKey,
                counter: verification.registrationInfo.counter,
                credentialDeviceType: verification.registrationInfo.credentialDeviceType,
                credentialBackedUp: verification.registrationInfo.credentialBackedUp,
                // `body` here is from Step 2
                transports: req.body.response.transports,
            };

            authenticators.push(newAuthenticator);

            console.debug("New authenticator registered", newAuthenticator);
        }

        res.json(verified);
    } catch (error) {
        if (error instanceof CustomError) {
            console.error(error);
            res.statusMessage = error.name;
            return res.status(error.code).json(error);
        }

        if (error instanceof Error) {
            console.error(error);
            return res.status(400).json(error);
        }

        console.error(error);
        return res.status(400).json(error);
    }
});
