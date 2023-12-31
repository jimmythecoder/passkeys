import * as express from "express";
import dotenv from "dotenv";
import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import dynamoose from "dynamoose";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { UserModel, User } from "@/models/user.js";
import { UserSession } from "@/models/userSession.js";
import { AuthChallenge } from "@/models/challenge.js";
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
} from "@/util/exceptions.js";
import { HttpStatusCode } from "@/util/constants.js";

dotenv.config();

const api = express.Router();
const IS_HTTPS = process.env.HTTPS === "true";
const SESSION_LIFETIME = parseInt(process.env.SESSION_LIFETIME ?? "0", 10) || 86400000;
const RP_ORIGIN = `${IS_HTTPS ? "https" : "http"}://${process.env.RP_ID}:${process.env.RP_PROXY_PORT ?? "3000"}`;
const RP_ID = process.env.RP_ID ?? "localhost";
const RP_NAME = process.env.RP_NAME ?? "Passkeys Example";
const USE_METADATA_SERVICE = process.env.USE_METADATA_SERVICE === "true";

function handleError(error: unknown, res: express.Response) {
    if (error instanceof CustomError) {
        console.error(error.toString());
        return res.status(error.code).json({ error });
    }

    if (error instanceof Error) {
        console.error("[ERROR]", error.message);
        return res.status(HttpStatusCode.BadRequest).json({ error });
    }

    console.error("[ERROR]", error);
    return res.status(HttpStatusCode.BadRequest).json(error);
}

api.post("/signout", async (req, res) => {
    try {
        const username = req.session.user?.userName;

        return req.session.destroy((error: string) => {
            if (error) {
                throw new Error(error);
            }

            console.debug("User signed out", username);

            res.json({ status: "ok" });
        });
    } catch (error) {
        return handleError(error, res);
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

        console.debug("User signing in", req.session.user.userName);

        return res.status(HttpStatusCode.OK).json(options);
    } catch (error) {
        return handleError(error, res);
    }
});

api.post("/signin/passkey", async (req, res) => {
    try {
        const credentials = ((req.body.authenticators ?? []) as string[]).map((cred) => {
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

        req.session.user = new User({ id: userAuthenticators[0].userId });
        req.session.challenge = challenge;

        console.debug("User signing in with Conditional UI", req.session.user.userName);

        return res.status(HttpStatusCode.OK).json(options);
    } catch (error) {
        return handleError(error, res);
    }
});

api.post("/signin/verify", async (req, res) => {
    try {
        if (!req.session.user) {
            throw new UserNotFound("User not found");
        }

        const userId = req.session.user.id;
        const challenge = new AuthChallenge(req.session.challenge);

        if (!challenge.currentChallenge) {
            throw new ChallengeError("Missing challenge, sign-in again");
        }

        const credentialID = isoBase64URL.toBuffer(req.body.rawId);

        if (!credentialID) {
            throw new ValidationError("Missing credential ID");
        }

        const [authenticator] = await AuthenticatorModel.query("credentialID").eq(credentialID).and().where("userId").eq(userId).exec();

        if (!authenticator) {
            throw new AuthenticatorMismatch(`Authenticator not found for userID`);
        }

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

        const user = await UserModel.get(authenticator.userId);

        req.session.user = user;
        req.session.isSignedIn = true;

        console.debug("User verified", user.userName);

        const session = new UserSession({
            userId: user.id,
            issuedAt: Date.now(),
            expiresAt: Date.now() + SESSION_LIFETIME,
        });

        return res.status(HttpStatusCode.Created).json({ user, session });
    } catch (error) {
        return handleError(error, res);
    } finally {
        // Prevent replay attacks with the same challenge
        delete req.session.challenge;
    }
});

api.post("/register", async (req, res) => {
    try {
        const userName = req.body.username as string;
        const displayName = req.body.displayName as string;

        if (!displayName) {
            throw new ValidationError("Name is required", "displayName");
        }

        if (!userName) {
            throw new ValidationError("Username is required", "username");
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

        req.session.user = user;
        req.session.challenge = challenge;

        console.debug("New user registration request", user.userName);

        return res.status(HttpStatusCode.OK).json(options);
    } catch (error) {
        return handleError(error, res);
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
            transports: req.body.response.transports,
        });

        const session = new UserSession({
            userId: user.id,
            issuedAt: Date.now(),
            expiresAt: Date.now() + SESSION_LIFETIME,
        });

        req.session.user = user;
        req.session.isSignedIn = true;

        console.debug("New user registered", user.userName);

        return res.status(HttpStatusCode.Created).json({ user, session, credentialID: Buffer.from(authenticator.credentialID).toString("base64") });
    } catch (error) {
        return handleError(error, res);
    } finally {
        delete req.session.challenge;
    }
});

export { api };
export default api;
