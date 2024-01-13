declare global {
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
