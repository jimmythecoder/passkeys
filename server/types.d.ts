declare module "express-session-jwt" {
    import session from "express-session";

    export default session;
}

declare global {
    declare module "express-session" {
        import { UserModel, AuthChallenge } from "@/data/users";
        
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
            user?: UserModel;

            /**
             * Sign in / register random challenge
             */
            challenge?: AuthChallenge;

            /**
             * Whether the user is signed in or not
             */
            isSignedIn?: boolean;
        }
    }
}
