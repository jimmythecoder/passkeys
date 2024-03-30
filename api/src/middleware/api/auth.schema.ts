export const schema = {
    request: {
        signin: {
            getCredentails: {
                type: "object",
                properties: {
                    /**
                     * Users can sign in with a username or email address
                     */
                    userName: { type: "string" },
                },
                required: ["userName"],
            },
            passkey: {
                type: "object",
                properties: {
                    /**
                     * Autenticator ids
                     */
                    authenticators: { type: "array", items: { type: "string" } },
                },
                required: ["authenticators"],
            },
            verify: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    rawId: { type: "string" },
                    response: {
                        type: "object",
                        properties: {
                            clientDataJSON: { type: "string" },
                            authenticatorData: { type: "string" },
                            signature: { type: "string" },
                            userHandle: { type: "string" },
                        },
                        required: ["clientDataJSON", "authenticatorData", "signature"],
                    },
                    authenticatorAttachment: { enum: ["cross-platform", "platform"] },
                    clientExtensionResults: {
                        type: "object",
                        properties: {
                            appid: { type: "boolean" },
                            credProps: {
                                type: "object",
                                properties: {
                                    rk: { type: "boolean" },
                                },
                            },
                            hmacCreateSecret: { type: "boolean" },
                        },
                        required: [],
                    },
                    type: { enum: ["public-key"] },
                },
                required: ["rawId", "id", "response", "clientExtensionResults", "type"],
            },
        },
        register: {
            getCredentials: {
                type: "object",
                properties: {
                    userName: { type: "string" },
                    displayName: { type: "string" },
                },
                required: ["userName", "displayName"],
            },
            verify: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    rawId: { type: "string" },
                    response: {
                        type: "object",
                        properties: {
                            clientDataJSON: { type: "string" },
                            attestationObject: { type: "string" },
                            authenticatorData: { type: "string" },
                            transports: { type: "array", items: { enum: ["ble", "hybrid", "internal", "nfc", "usb"] } },
                            publicKeyAlgorithm: { type: "number" },
                            publicKey: { type: "string" },
                        },
                        required: ["clientDataJSON", "attestationObject"],
                    },
                    authenticatorAttachment: { enum: ["cross-platform", "platform"] },
                    clientExtensionResults: {
                        type: "object",
                        properties: {
                            appid: { type: "boolean" },
                            credProps: {
                                type: "object",
                                properties: {
                                    rk: { type: "boolean" },
                                },
                            },
                            hmacCreateSecret: { type: "boolean" },
                        },
                        required: [],
                    },
                    type: { enum: ["public-key"] },
                },
                required: ["rawId", "id", "response", "clientExtensionResults", "type"],
            },
        },
    },
} as const;

export default schema;
