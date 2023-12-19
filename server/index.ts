import * as SimpleWebAuthnServer from "@simplewebauthn/server";
import express from "express";
import bodyParser from "body-parser";

type User = {
    credentialID: string;
    credentialPublicKey: string;
    counter: Uint8Array;
};

const users = {} as Record<string, User>;
const challenges = {} as Record<string, string>;
const rpId = 'localhost';
const expectedOrigin =  ['http://localhost:3000'];

const app = express();
app.use(bodyParser.json());

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.listen(8080, () => {
    console.log("Server is listening on port 8080");
});

function getNewChallenge() {
    return Math.random().toString(36).substring(2);
}

function convertChallenge(challenge: string) {
    return btoa(challenge).replaceAll('=', '');
}

function uintToString(a: Uint8Array) {
    const base64string = btoa(String.fromCharCode(...a));
    return base64string.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64ToUint8Array(str: string) {
    str = str.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '');
    return new Uint8Array(Array.prototype.map.call(atob(str), (c) => c.charCodeAt(0)));
}

function getSavedAuthenticatorData(user: Record<string, string>) {
    return {
        credentialID: base64ToUint8Array(user.credentialID),
        credentialPublicKey: base64ToUint8Array(user.credentialPublicKey),
        counter: user.counter,
    }
}

function getRegistrationInfo(registrationInfo: Record<string, unknown>) {
    return {
        credentialID: uintToString(registrationInfo.credentialID as Uint8Array),
        credentialPublicKey: uintToString(registrationInfo.credentialPublicKey as Uint8Array),
        counter: registrationInfo.counter as Uint8Array,
    }
}

app.post("/register/start", (req, res) => {
    const username = req.body.username;
    const challenge = getNewChallenge();
    challenges[username] = convertChallenge(challenge);
    const pubKey = {
        challenge: challenge,
        rp: { id: rpId, name: "webauthn-app" },
        user: { id: username, name: username, displayName: username },
        pubKeyCredParams: [
            { type: "public-key", alg: -7 }, // ECDSA w/ SHA-256
            { type: "public-key", alg: -257 }, // RSASSA-PKCS1-v1_5 using SHA-256
        ],
        authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
            residentKey: "preferred",
            requireResidentKey: false,
        },
    };
    res.json(pubKey);
});

app.post("/register/finish", async (req, res) => {
    const username = req.body.username;
    // Verify the attestation response
    let verification;
    try {
        verification = await SimpleWebAuthnServer.verifyRegistrationResponse({
            response: req.body.data,
            expectedChallenge: challenges[username],
            expectedOrigin,
        });
    } catch (error) {
        console.error(error);
        return res.status(400).send({ error: error.message });
    }
    const { verified, registrationInfo } = verification;
    if (verified && registrationInfo) {
        users[username] = getRegistrationInfo(registrationInfo);
        return res.status(200).json({ success: true, users });
    }
    res.status(500).send(false);
});

app.post("/login/start", (req, res) => {
    const username = req.body.username;
    // if (!users[username]) {
    //     res.status(404).json({ error: "User not found", users });
    // }
    const challenge = getNewChallenge();
    challenges[username] = convertChallenge(challenge);
    res.json({
        challenge,
        rpId,
        // allowCredentials: [
        //     {
        //         type: "public-key",
        //         // id: users[username].credentialID,
        //         transports: ["internal"],
        //     },
        // ],
        // authenticatorType: "auto",
        // userVerification: "discouraged",
    });
});

app.post("/login/finish", async (req, res) => {
    const username = req.body.username;
    if (!users[username]) {
        res.status(404).send(false);
    }
    let verification;
    try {
        const user = users[username];
        verification = await SimpleWebAuthnServer.verifyAuthenticationResponse({
            expectedChallenge: challenges[username],
            response: req.body.data,
            authenticator: getSavedAuthenticatorData(user),
            expectedRPID: rpId,
            expectedOrigin,
        });
    } catch (error) {
        console.error(error);
        return res.status(400).send({ error: error.message });
    }

    const { verified } = verification;
    if (verified) {
        return res.status(200).send(true);
    }
    return res.status(400).send(false);
});

