module.exports = {
    root: true,
    env: { browser: true, node: true, es2022: true },
    extends: [
        "airbnb-base",
        "airbnb-typescript/base",
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:react-hooks/recommended",
        "prettier",
        "plugin:prettier/recommended",
        "plugin:json/recommended",
    ],
    ignorePatterns: ["dist", ".eslintrc.cjs", "public"],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        project: ["./tsconfig.json", "./tsconfig.node.json"],
        tsconfigRootDir: "./",
        sourceType: "module",
        extraFileExtensions: [".json"],
        ecmaVersion: "latest",
    },
    plugins: ["react-refresh", "prettier"],
    rules: {
        "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
        "no-new": "off",
        "import/extensions": ["error", "ignorePackages", { "": "never", ts: "never", tsx: "never" }], // Allow imports without extensions
    },
};
