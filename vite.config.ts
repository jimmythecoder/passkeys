import { defineConfig, loadEnv } from "vite";
import path from "path";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {

    const env = loadEnv(mode, process.cwd());

    return {
        plugins: [react()],
        // envDir: ".",
        server: {
            port: parseInt(env.VITE_PORT, 10) || 3000,
            host: true,
            proxy: {
                "/api": {
                    target: env.VITE_API_URL,
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/api/, ""),
                },
            },
        },
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "./src"),
            },
        },
    };
});
