# Plugins

Users of plugins that rely on `jsonc-eslint-parser` need to explicitly configure the parser for files linted with that plugin.

Consider including snippets like the following in the plugin's documentation:

```shell
npm install eslint eslint-plugin-your-name-here jsonc-eslint-parser --save-dev
```

```js
module.exports = {
  // ...
  overrides: [
    {
      files: ["*.json", "*.json5"],
      extends: ["plugin:your-name-here/recommended"],
      parser: "jsonc-eslint-parser",
      plugins: ["your-name-here"],
    },
  ],
};
```

See [`eslint-plugin-jsonc`](https://github.com/ota-meshi/eslint-plugin-jsonc) for an example package.

## TypeScript

`jsonc-eslint-parser` exports types that replace the following built-in ESLint types:

- `RuleFunction`: Sets the `node` parameter to be an `AST.JSONNode` or `never`
- `RuleListener`: Replaces built-in rule listeners with JSON node types
  - For example, `JSONLiteral(node) {` sets type `AST.JSONLiteral` for `node`
  - It also sets the equivalent `:exit` types, such as `'JSONLiteral:exit(node) {`

See [`eslint-plugin-jsonc`](https://github.com/ota-meshi/eslint-plugin-jsonc)'s [`lib/types.ts`](https://github.com/ota-meshi/eslint-plugin-jsonc/blob/master/lib/types.ts) for example usage of this parser's TypeScript types.
