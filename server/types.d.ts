declare module "express-session-jwt" {
    import session from "express-session";

    export default session;
}

declare global {
    declare module "express-session" {
        interface SessionOptions {
            keys: {
                private: string;
                public: string;
            };
        }

        interface SessionData {
            /**
             * User Model for the current user
             */
            user?: import("./models/user").User;

            /**
             * Sign in / register random challenge
             */
            challenge?: import("./models/user").AuthChallenge;

            /**
             * Whether the user is signed in or not
             */
            isSignedIn?: boolean;
        }
    }
}
