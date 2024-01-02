declare module "express-session-jwt" {
    import session from "express-session";

    export default session;
}

declare global {
    declare module "express-session" {
        import { UserModel } from "./data/users";
        
        interface SessionOptions {
            keys: {
                private: string;
                public: string;
            };
        }

        interface SessionData {
            user?: UserModel;
        }
    }
}
