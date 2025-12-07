import myPlugin from "@ota-meshi/eslint-plugin";

export default [
  {
    ignores: [
      "lib/**",
      "coverage/**",
      "explorer/**",
      "node_modules/**",
      ".nyc_output/**",
      "tests/fixtures/**",
    ],
  },
  ...myPlugin.config({
    node: true,
    json: true,
    prettier: true,
    packageJson: true,
    ts: true,
  }),
  {
    files: ["**/*.mjs"],
    languageOptions: {
      sourceType: "module",
    },
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      sourceType: "module",
      parserOptions: {
        project: "./tsconfig.json",
      },
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
        {
          selector: "import",
          format: ["camelCase", "PascalCase", "UPPER_CASE"],
        },
      ],
    },
  },
];
