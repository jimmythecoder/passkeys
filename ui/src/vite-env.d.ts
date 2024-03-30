/// <reference types="vite/client" />

interface ImportMetaEnv {
    /**
     * Current version of the application from package.json
     */
    readonly VITE_APP_VERSION: string;

    readonly VITE_USE_MOCKS: string;

    readonly VITE_API_URL: string;

    readonly VITE_AWS_RUM_APPLICATION_ID: string;

    readonly VITE_AWS_RUM_GUEST_ROLE_ARN: string;

    readonly VITE_AWS_RUM_IDENTITY_POOL_ID: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
