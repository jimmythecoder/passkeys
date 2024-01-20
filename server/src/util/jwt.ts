import * as jose from "jose";

export type Options = {
    /**
     * The issuer of the JWT.
     * Defaults to https://example.com.
     */
    issuer?: string;

    /**
     * The intended audience for the JWT.
     * Defaults to example.com.
     */
    audience?: string;

    /**
     * The time the JWT expires.
     * Defaults to 2 hours.
     */
    expiration?: number | string | Date;

    /**
     * The algorithm to use for signing the JWT.
     * Defaults to EdDSA.
     */
    algorithm?: string;
};

/**
 * Sign a JWT.
 * @param data Object to sign.
 * @param jwk JsonWebKey to sign with using the EdDSA algorithm.
 * @param options Options for the JWT.
 * @returns The signed JWT.
 */
export const sign = async (data: Record<string, unknown>, jwk: jose.JWK, options: Options = {}) => {
    const alg = jwk.alg ?? options.algorithm ?? "EdDSA";

    const key = await jose.importJWK(jwk);

    const jwt = await new jose.SignJWT(data)
        .setProtectedHeader({ alg })
        .setIssuedAt()
        .setIssuer(options.issuer ?? "https://example.com")
        .setAudience(options.audience ?? "example.com")
        .setExpirationTime(options.expiration ?? "2h")
        .sign(key);

    return jwt;
};

export const encrypt = async (data: Record<string, unknown>, jwk: jose.JWK, options: Options = {}) => {
    const alg = jwk.alg ?? options.algorithm ?? "EdDSA";

    const key = await jose.importJWK(jwk);

    const jwt = await new jose.EncryptJWT(data)
        .setProtectedHeader({ alg, enc: "Ed25519" })
        .setIssuedAt()
        .setIssuer(options.issuer ?? "https://example.com")
        .setAudience(options.audience ?? "example.com")
        .setExpirationTime(options.expiration ?? "2h")
        .encrypt(key);

    return jwt;
};

export default {
    sign,
};
