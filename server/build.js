import esbuild from "esbuild";

esbuild.build({
    bundle: true,
    platform: "node",
    format: "esm",
    outExtension: { ".js": ".mjs" },
    minify: false,
    sourcemap: false,
    // packages: "external",
    outdir: "./lambda",
    outbase: "./src",
    // Fix for https://github.com/evanw/esbuild/pull/2067
    banner: {
        js: `import { createRequire } from 'module';
            const __dirname = import.meta.url;
            const require = createRequire(import.meta.url);`,
    },
    entryPoints: ["./src/index.mts"],
    external: ["aws-sdk", "@aws-sdk/client-ssm"],
});
