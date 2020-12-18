# jsonc-eslint-parser

## :name_badge: Introduction

[JSON], [JSONC] and [JSON5] parser for use with [ESLint] plugins.

This parser allows us to lint [JSON], [JSONC] and [JSON5] files.
This parser and the rules of [eslint-plugin-jsonc] would catch some of the mistakes and code style violations.

See [eslint-plugin-jsonc] for details.

## :cd: Installation

```bash
npm i --save-dev jsonc-eslint-parser
```

## :book: Usage

In your ESLint configuration file, set the `overrides` > `parser` property:

```json5
{
  // ...
  // Add the following settings.
  "overrides": [
    {
      "files": ["*.json", "*.json5"], // Specify the extension or pattern you want to parse as JSON.
      "parser": "jsonc-eslint-parser", // Set this parser.
    },
  ],
}
```

## :gear: Configuration

The following additional configuration options are available by specifying them in [parserOptions](https://eslint.org/docs/user-guide/configuring#specifying-parser-options-1) in your ESLint configuration file.

```json5
{
  // ...
  "overrides": [
    {
      "files": ["*.json", "*.json5"],
      "parser": "jsonc-eslint-parser",
      // Additional configuration options
      "parserOptions": {
        "jsonSyntax": "JSON5"
      }
    },
  ],
}
```

### `parserOptions.jsonSyntax`

Set to `"JSON"`, `"JSONC"` or `"JSON5"`. Select the JSON syntax you are using.  
If not specified, all syntaxes that express static values ​​are accepted. For example, template literals without interpolation.  

**Note** : Recommended to loosen the syntax checking by the parser and use check rules of [eslint-plugin-jsonc] to automatically fix it.

## Usage for Custom Rules / Plugins

- [AST.md](./docs/AST.md) is AST specification.
- [no-template-literals.ts](https://github.com/ota-meshi/eslint-plugin-jsonc/blob/master/lib/rules/no-template-literals.ts) is an example.
- You can see the AST on the [Online DEMO](https://ota-meshi.github.io/jsonc-eslint-parser/).

## :lock: License

See the [LICENSE](LICENSE) file for license rights and limitations (MIT).

[JSON]: https://json.org/
[JSONC]: https://github.com/microsoft/node-jsonc-parser
[JSON5]: https://json5.org/
[ESLint]: https://eslint.org/
[eslint-plugin-jsonc]: https://www.npmjs.com/package/eslint-plugin-jsonc
