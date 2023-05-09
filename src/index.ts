import { parseForESLint } from "./parser/parser";
import { traverseNodes } from "./parser/traverse";
import {
  getStaticJSONValue,
  isExpression,
  isNumberIdentifier,
  isUndefinedIdentifier,
} from "./utils/ast";

import type * as AST from "./parser/ast";
import { getVisitorKeys } from "./parser/visitor-keys";
export * as meta from "./meta";
export { name } from "./meta";

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
export function parseJSON(
  code: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- any
  options?: any
): AST.JSONProgram {
  return parseForESLint(code, options).ast as never;
}

// types
export { AST };
