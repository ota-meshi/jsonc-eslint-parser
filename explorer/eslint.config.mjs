import myPlugin from "@ota-meshi/eslint-plugin";

export default [
  {
    ignores: ["dist/**", "node_modules/**", "shim/**"],
  },
  ...myPlugin.config({
    vue3: true,
    json: true,
    prettier: true,
  }),
  {
    languageOptions: {
      sourceType: "module",
      ecmaVersion: 2020,
      globals: {
        URL: "readonly",
      },
    },
    rules: {
      "n/no-unsupported-features/es-syntax": "off",
      "n/no-missing-import": "off",
    },
  },
];
