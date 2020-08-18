"use strict"

module.exports = {
    extends: [
        "plugin:@ota-meshi/recommended",
        "plugin:@ota-meshi/+typescript",
        "plugin:@ota-meshi/+json",
        "plugin:@ota-meshi/+node",
        "plugin:@ota-meshi/+prettier",
    ],
    overrides: [
        {
            files: ["*.ts"],
            parserOptions: {
                sourceType: "module",
                project: "./tsconfig.json",
            },
            rules: {
                "@typescript-eslint/no-non-null-assertion": "off",
            },
        },
    ],
}
