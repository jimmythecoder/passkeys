/// <reference types="vite/client" />

interface ImportMetaEnv {
    /**
     * Current version of the application from package.json
     */
    readonly VITE_APP_VERSION: string;

    readonly VITE_USE_MOCKS: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
