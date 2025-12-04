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
export const jsoncESLintParser = {
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

// Types must be exported separately.
export type * from "./types";
export { AST };

// Remove the following legacy code block in the next major version.

// -------------------------------------------------------------------------------------------------

// The old way of importing this plugin was: `import jsoncParser from "jsonc-eslint-parser";`
// We export the individual members to ensure that this syntax will still work.
// eslint-disable-next-line @typescript-eslint/naming-convention -- required name by ESLint
const VisitorKeys = getVisitorKeys();
export {
  meta,
  name,

  // parser
  parseJSON,
  parseForESLint,
  traverseNodes,
  VisitorKeys,

  // utils
  getStaticJSONValue,
  isExpression,
  isNumberIdentifier,
  isUndefinedIdentifier,
};

// -------------------------------------------------------------------------------------------------
