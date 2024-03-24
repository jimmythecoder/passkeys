export type ENV = {
    AWS_REGION: string;
    AWS_DOMAIN_HOSTED_ZONE_ID: string;
    ROOT_DOMAIN: string;
    WEB_DOMAIN: string;
    API_DOMAIN: string;
    CERTIFICATE_ARN: string;
    RP_ID: string;
    RP_ORIGIN: string;
    SESSION_HEX_KEY: string;
    NODE_ENV: string;
    JWKS_PUBLIC_KEYS: string;
    JWK_PRIVATE_KEY: string;
    SESSION_COOKIE_DOMAIN: string;
    JWT_AUDIENCE: string;
    JWT_ISSUER: string;
    COOKIE_SECRET: string;
};
