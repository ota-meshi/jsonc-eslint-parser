module.exports = {
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2020,
  },
  extends: [
    "plugin:@ota-meshi/+vue3",
    "plugin:@ota-meshi/+json",
    "plugin:@ota-meshi/+prettier",
  ],
  rules: {
    "n/no-unsupported-features/es-syntax": "off",
    "n/no-missing-import": "off",
  },
};
