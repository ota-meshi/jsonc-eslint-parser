import { parseForESLint, parseJSON } from "./parser/parser.ts";
import { tokenize } from "./parser/tokenizer.ts";
import { traverseNodes } from "./parser/traverse.ts";
import {
  getStaticJSONValue,
  isExpression,
  isNumberIdentifier,
  isUndefinedIdentifier,
} from "./utils/ast.ts";

import type * as AST from "./parser/ast.ts";
import { getVisitorKeys } from "./parser/visitor-keys.ts";
export * as meta from "./meta.ts";
export { name } from "./meta.ts";
export type * from "./types.ts";

// parser
export { parseForESLint };
// Keys
// eslint-disable-next-line @typescript-eslint/naming-convention -- parser module
export const VisitorKeys = getVisitorKeys();

// tools
export {
  traverseNodes,
  getStaticJSONValue,
  isExpression,
  isNumberIdentifier,
  isUndefinedIdentifier,
};

/**
 * Parse JSON source code
 */
export { parseJSON, tokenize };

// types
export type { AST };
