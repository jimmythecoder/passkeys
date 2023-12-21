import jwtSession from "express-session-jwt";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const fileName = fileURLToPath(import.meta.url);
const dirName = path.dirname(fileName);

export const session = (name: string, secret: string, maxAge: number) =>
    jwtSession({
        secret,
        keys: {
            private: readFileSync(`${path.resolve(dirName)}/../keys/ec-secp256k1-priv-key.pem`, "utf8"),
            public: readFileSync(`${path.resolve(dirName)}/../keys/ec-secp256k1-public-key.pem`, "utf8"),
        },
        resave: false,
        saveUninitialized: true,
        name,
        cookie: {
            secure: true,
            httpOnly: true,
            sameSite: "strict",
            maxAge,
        },
    });

export default session;
