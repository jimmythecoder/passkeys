declare global {
    declare module "fastify" {
        interface FastifyInstance {
            jwks: {
                public: import("jose").JWK;
                private: import("jose").JWK;
                issuer?: string;
                audience?: string;
            };
        }
    }

    declare module "@fastify/secure-session" {
        interface SessionData {
            /**
             * User Model for the current user
             */
            user?: import("./src/models/user").User;

            /**
             * Sign in / register random challenge
             */
            challenge?: import("./src/models/user").AuthChallenge;

            /**
             * Whether the user is signed in or not
             */
            isSignedIn?: boolean;
        }
    }
}
