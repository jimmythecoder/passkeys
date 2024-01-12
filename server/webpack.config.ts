import path from "node:path";
import webpack from "webpack";
import * as url from "url";
import Dotenv from "dotenv-webpack";

const dirname = url.fileURLToPath(new URL(".", import.meta.url));

const config: webpack.Configuration = {
    mode: "production",
    entry: "./src/lambda.ts",
    target: "node",
    output: {
        path: path.resolve(dirname, "lambda"),
        filename: "index.js",
    },
    devtool: false,
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
        ],
    },
    plugins: [new Dotenv()],
    resolve: {
        extensions: [".ts", ".js"],
        alias: {
            "@": path.resolve(dirname, "src/"),
        },
    },
};

export default config;
