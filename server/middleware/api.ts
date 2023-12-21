import * as express from "express";
import { Users } from "@/data/users";

export const api = express.Router();
export const users = new Users();

api.post("/signin", async (req, res) => {
    res.json({ message: "ok", username: req.body.username });
});

api.post("/register", async (req, res) => {

    const user = users.insert({
        name: req.body.username,
        displayName: "John Smith",
        username: req.body.username,
    });

    const challenge = crypto.getRandomValues(new Uint8Array(32));

    const publicKey = {
        // Our challenge should be a base64-url encoded string
        challenge: new TextEncoder().encode(Buffer.from(challenge).toString("base64")),
        rp: {
            id: "localhost",
            name: "Passkey Demo",
        },
        user: user.encode(),
        pubKeyCredParams: [
            // See COSE algorithms for more:
            {
                type: "public-key",
                alg: -7, // ES256
            },
            {
                type: "public-key",
                alg: -256, // RS256
            },
            {
                type: "public-key",
                alg: -37, // PS256
            },
        ],
        authenticatorSelection: {
            userVerification: "preferred", // Do you want to use biometrics or a pin?
            residentKey: "required", // Create a resident key e.g. passkey
        },
        attestation: "indirect", // indirect, direct, or none
        timeout: 60_000,
    } as PublicKeyCredentialCreationOptions;

    res.json({ publicKey });
});
