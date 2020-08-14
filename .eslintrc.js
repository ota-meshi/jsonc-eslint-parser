"use strict"

// const version = require("./package.json").version

module.exports = {
    parserOptions: {
        sourceType: "script",
        ecmaVersion: 2020,
    },
    extends: [
        "plugin:@mysticatea/es2015",
        "plugin:@mysticatea/+node",
        "plugin:@mysticatea/+eslint-plugin",
        "plugin:jsonc/auto-config",
        "plugin:jsonc/recommended-with-json",
    ],
    rules: {
        "require-jsdoc": "error",
        "no-warning-comments": "warn",
        "no-lonely-if": "off",
        "@mysticatea/ts/ban-ts-ignore": "off",
    },
    overrides: [
        {
            files: ["*.ts"],
            rules: {
                // "@mysticatea/ts/no-require-imports": "off",
                // "@mysticatea/ts/no-var-requires": "off",
                "@mysticatea/node/no-missing-import": "off",
                "no-implicit-globals": "off",
                "@mysticatea/node/no-extraneous-import": "off",
            },
            parserOptions: {
                sourceType: "module",
                project: "./tsconfig.json",
            },
        },
        {
            files: ["src/rules/**"],
            rules: {
                "@mysticatea/eslint-plugin/report-message-format": [
                    "error",
                    "[^a-z].*\\.$",
                ],
                "@mysticatea/eslint-plugin/require-meta-docs-url": "off",
            },
        },
        {
            files: ["scripts/**/*.ts", "tests/**/*.ts"],
            rules: {
                "require-jsdoc": "off",
                "no-console": "off",
            },
        },
    ],
}
