"use strict"

module.exports = {
    extends: [
        "plugin:@ota-meshi/recommended",
        "plugin:@ota-meshi/+typescript",
        "plugin:@ota-meshi/+json",
        "plugin:@ota-meshi/+package-json",
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
                "@typescript-eslint/naming-convention": [
                    "error",
                    {
                        selector: "default",
                        format: ["camelCase"],
                        leadingUnderscore: "allow",
                        trailingUnderscore: "allow",
                    },

                    {
                        selector: "variable",
                        format: ["camelCase", "UPPER_CASE"],
                        leadingUnderscore: "allow",
                        trailingUnderscore: "allow",
                    },

                    {
                        selector: "typeLike",
                        format: ["PascalCase"],
                    },
                    {
                        selector: "property",
                        format: ["camelCase", "PascalCase"],
                    },
                    {
                        selector: "method",
                        format: ["camelCase", "PascalCase"],
                    },
                ],
            },
        },
    ],
}
