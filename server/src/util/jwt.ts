import * as jose from "jose";

export const DEFAULT_SIGN_OPTIONS = {
    expiration: "2h",
    algorithm: "EdDSA",
    curve: "Ed25519",
} as const;

export type Options = {
    /**
     * The issuer of the JWT.
     */
    issuer: string;

    /**
     * The intended audience for the JWT.
     */
    audience: string;

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

    /**
     * Elliptic curve to use for signing the JWT.
     * @default "Ed25519"
     */
    curve?: string;
};

export type JWK = jose.JWK;

/**
 * Sign a JWT.
 * @param data Object to sign.
 * @param jwk JsonWebKey to sign with using the EdDSA algorithm.
 * @param options {Options} for the JWT.
 * @returns The signed JWT.
 */
export const sign = async (data: Record<string, unknown>, jwk: jose.JWK, options: Options) => {
    const alg = jwk.alg ?? options.algorithm ?? DEFAULT_SIGN_OPTIONS.algorithm;

    const key = await jose.importJWK(jwk);

    return new jose.SignJWT(data)
        .setProtectedHeader({ alg, typ: "JWT", kid: jwk.kid })
        .setIssuedAt()
        .setIssuer(options.issuer)
        .setAudience(options.audience)
        .setExpirationTime(options.expiration ?? DEFAULT_SIGN_OPTIONS.expiration)
        .sign(key);
};

export const encrypt = async (data: Record<string, unknown>, jwk: jose.JWK, options: Options) => {
    const alg = jwk.alg ?? options.algorithm ?? DEFAULT_SIGN_OPTIONS.algorithm;

    const key = await jose.importJWK(jwk);

    return new jose.EncryptJWT(data)
        .setProtectedHeader({ alg, kid: jwk.kid, enc: options.curve ?? DEFAULT_SIGN_OPTIONS.curve })
        .setIssuedAt()
        .setExpirationTime(options.expiration ?? DEFAULT_SIGN_OPTIONS.expiration)
        .setIssuer(options.issuer)
        .setAudience(options.audience)
        .encrypt(key);
};

export const verify = async (token: string, keys: jose.JWK[], options: Options) => {
    const jwks = jose.createLocalJWKSet({ keys });
    const jwt = await jose.jwtVerify(token, jwks, {
        algorithms: [options.algorithm ?? DEFAULT_SIGN_OPTIONS.algorithm],
        issuer: options.issuer,
        audience: options.audience,
    });

    return jwt;
};

export default {
    sign,
    encrypt,
    verify,
};
