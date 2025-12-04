import { parseForESLint, parseJSON } from "./parser/parser";
import { traverseNodes } from "./parser/traverse";
import {
  getStaticJSONValue,
  isExpression,
  isNumberIdentifier,
  isUndefinedIdentifier,
} from "./utils/ast";
import type * as AST from "./parser/ast";
import { getVisitorKeys } from "./parser/visitor-keys";
import * as meta from "./meta";
import { name } from "./meta";

// We use a named export since it is more idiomatic in modern TypeScript.
// https://medium.com/@stayyabmazhar19991/why-default-exports-are-bad-in-javascript-a-comprehensive-guide-7c77abc7061d
export const jsoncParser = {
  meta,
  name,

  // parser
  parseJSON,
  parseForESLint,
  traverseNodes,
  VisitorKeys: getVisitorKeys(),

  // utils
  getStaticJSONValue,
  isExpression,
  isNumberIdentifier,
  isUndefinedIdentifier,
};

// We also export the named export as the default export for backwards compatibility.
export default jsoncParser;

// Types must be exported separately.
export type * from "./types";
export { AST };
