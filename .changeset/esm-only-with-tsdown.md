---
"jsonc-eslint-parser": major
---

Convert package to ESM-only. The package now uses `"type": "module"` and is built using tsdown for optimized bundling. CommonJS support has been removed - consumers must use ESM imports.

Breaking changes:
- Package is now ESM-only (no CommonJS exports)
- Requires Node.js with ESM support
- Built using tsdown instead of tsc for better bundle optimization
