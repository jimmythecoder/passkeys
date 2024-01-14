/**
 * Generate a keypair using EdDSA for signing and verifying JWTs.
 */
import crypto from "crypto";

const keypair = crypto.generateKeyPairSync("ed25519", {
    privateKeyEncoding: { format: "pem", type: "pkcs8" },
    publicKeyEncoding: { format: "pem", type: "spki" },
});

console.debug(keypair.privateKey);
console.debug(keypair.publicKey);

console.debug("Private Hex:", Buffer.from(keypair.privateKey, "utf8").toString("hex"));
console.debug("Public Hex:", Buffer.from(keypair.publicKey, "utf8").toString("hex"));
