module.exports = {
    parserOptions: {
        sourceType: "module",
        ecmaVersion: 2020,
    },
    extends: ["plugin:@ota-meshi/+vue3", "plugin:@ota-meshi/+prettier"],
    rules: {
        "node/no-unsupported-features/es-syntax": "off",
    },
}
