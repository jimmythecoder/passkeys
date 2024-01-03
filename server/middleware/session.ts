import jwtSession from "express-session-jwt";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();
const fileName = fileURLToPath(import.meta.url);
const dirName = path.dirname(fileName);
const isSecure = process.env.HTTPS === "true";

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
            secure: isSecure,
            httpOnly: true,
            sameSite: "strict",
            maxAge,
        },
    });

export default session;
