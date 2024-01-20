/**
 * Generate a keypair using EdDSA for signing and verifying JWTs.
 */
import crypto from "crypto";

// const keypair = crypto.generateKeyPairSync("ed25519", {
//     privateKeyEncoding: { format: "pem", type: "pkcs8" },
//     publicKeyEncoding: { format: "pem", type: "spki" },
// });

// console.debug(keypair.privateKey);
// console.debug(keypair.publicKey);

// console.debug("Private Hex:", Buffer.from(keypair.privateKey, "utf8").toString("hex"));
// console.debug("Public Hex:", Buffer.from(keypair.publicKey, "utf8").toString("hex"));

const keypair = crypto.generateKeyPairSync("ed25519", {
    privateKeyEncoding: { format: "jwk" },
    publicKeyEncoding: { format: "jwk" },
});

console.debug(keypair);
console.debug(keypair.privateKey);
console.debug(typeof keypair.publicKey);

console.debug("Private Hex:", Buffer.from(JSON.stringify(keypair.privateKey), "utf8").toString("hex"));
console.debug("Public Hex:", Buffer.from(JSON.stringify(keypair.publicKey), "utf8").toString("hex"));

// Not yet supported hmm...
// crypto.subtle
//     .generateKey(
//         {
//             name: "EdDSA",
//             namedCurve: "Ed25519",
//         },
//         true,
//         ["sign", "verify"],
//     )
//     .then((keyPair) => {
//         crypto.subtle.exportKey("jwk", keyPair.privateKey).then((jwk) => {
//             console.debug("Private JWK:", jwk);
//         });
//         crypto.subtle.exportKey("jwk", keyPair.publicKey).then((jwk) => {
//             console.debug("Public JWK:", jwk);
//         });
//     });
