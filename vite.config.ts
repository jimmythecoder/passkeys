import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd());

    return {
        plugins: [react({ devTarget: "es2022", tsDecorators: true })],
        test: {
            globals: true,
            environment: "happy-dom",
            setupFiles: ["./tests/unit/setup.ts"],
            include: ["./tests/unit/**/*.spec.{ts,tsx}", "./src/**/*.spec.{ts,tsx}"],
            reporters: ["default", "junit"],
            outputFile: "tests.junit.xml",
        },
        server: {
            open: true,
            port: parseInt(env.VITE_PORT, 10) || 3000,
            host: true,
            proxy: {
                "/api": {
                    target: env.VITE_API_URL,
                },
            },
        },
        resolve: {
            alias: {
                "@": "/src",
            },
        },
    };
});
