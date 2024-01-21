declare global {
    declare module "fastify" {
        interface FastifyInstance {
            jwks: {
                public: import("jose").JWK[];
                private: import("jose").JWK;
                issuer: string;
                audience: string;
            };
        }

        interface FastifyRequest {
            session: import("@/plugins/jwt-stateless-session").Session;
        }
    }
}
