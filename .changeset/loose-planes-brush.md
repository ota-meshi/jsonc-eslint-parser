---
"jsonc-eslint-parser": minor
---

Add named export `jsoncESLintParser` as the new recommended way to import the parser. This provides a more idiomatic TypeScript import pattern while maintaining full backward compatibility with the existing export structure.

**New usage (recommended):**

```js
import { jsoncESLintParser } from "jsonc-eslint-parser";
```

The `jsoncESLintParser` export includes all parser functionality:

- `meta` and `name` metadata
- `parseJSON` and `parseForESLint` parser functions
- `traverseNodes` for AST traversal
- `VisitorKeys` for node visiting
- Utility functions: `getStaticJSONValue`, `isExpression`, `isNumberIdentifier`, `isUndefinedIdentifier`

**Backward compatibility:**
All existing exports remain available and unchanged, so existing code will continue to work without modifications. However, the old pattern will no longer work in the next major version, so users are encouraged to change to the new format.
