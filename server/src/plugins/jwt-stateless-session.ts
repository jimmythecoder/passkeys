import { FastifyPluginAsync } from "fastify";
import * as jose from "jose";
import fp from "fastify-plugin";
import { sign, verify } from "@/util/jwt";

type SessionOptions = {
    jwt: {
        issuer: string;
        audience: string;
        sign: {
            key: jose.JWK;
            algorithm: string;
            expiresIn: string;
        };
        verify: {
            keys: jose.JWK[];
            algorithms: string[];
        };
    };

    cookie: {
        name: string;
        path: string;
        httpOnly: boolean;
        secure: boolean;
        maxAge: number;
        sameSite: "strict";
        domain: string;
    };
};

export class Session {
    public isModified = false;

    public isDeleted = false;

    public roles: string[] = [];

    constructor(
        public data: Record<string, unknown>,
        public readonly options: SessionOptions,
    ) {}

    get<T>(key: string): T {
        return this.data[key] as T;
    }

    set(key: string, value: unknown) {
        this.data[key] = value;
        this.isModified = true;
    }

    setRoles(roles: string[]) {
        this.roles = roles;
        this.isModified = true;
    }

    reset() {
        this.data = {};
        this.roles = [];
        this.isModified = true;
    }

    /**
     * Delete the session from the store.
     */
    delete() {
        this.data = {};
        this.roles = [];
        this.isDeleted = true;
    }

    async sign() {
        this.isModified = false;
        return sign(this.data, this.options.jwt.sign.key, {
            issuer: this.options.jwt.issuer,
            audience: this.options.jwt.audience,
            algorithm: this.options.jwt.sign.algorithm,
            expiration: this.options.jwt.sign.expiresIn,
        });
    }

    async verify(token: string) {
        return verify<{ roles: string[] }>(token, this.options.jwt.verify.keys, {
            issuer: this.options.jwt.issuer,
            audience: this.options.jwt.audience,
        });
    }
}

const plugin: FastifyPluginAsync<SessionOptions> = async (fastify, opts) => {
    fastify.decorateRequest("session", null);

    fastify.addHook("onRequest", async (request) => {
        request.session = new Session({}, opts);

        const token = request.cookies[opts.cookie.name];

        if (!token) {
            return;
        }

        try {
            const jwt = await request.session.verify(token);

            request.session = new Session(jwt.payload, opts);
        } catch (err) {
            console.error(err);
        }
    });

    fastify.addHook("onSend", async (request, reply, payload) => {
        if (request.session.isDeleted) {
            reply.clearCookie(opts.cookie.name);
            return payload;
        }

        if (!request.session.isModified) {
            return payload;
        }

        const token = await request.session.sign();

        reply.setCookie(opts.cookie.name, token, {
            path: opts.cookie.path,
            httpOnly: opts.cookie.httpOnly,
            secure: opts.cookie.secure,
            maxAge: opts.cookie.maxAge,
            sameSite: opts.cookie.sameSite,
            domain: opts.cookie.domain,
        });

        return payload;
    });
};

export const jwtStatelessSession = fp(plugin, {
    fastify: "4.x",
    name: "jwt-stateless-session",
});

export default jwtStatelessSession;
