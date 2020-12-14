import { parseForESLint } from "./parser/parser"
import { traverseNodes } from "./parser/traverse"
import {
    getStaticJSONValue,
    isExpression,
    isNumberIdentifier,
    isUndefinedIdentifier,
} from "./utils/ast"

import type * as AST from "./parser/ast"
import { KEYS } from "./parser/visitor-keys"

// parser
export { parseForESLint }
// Keys
// eslint-disable-next-line @typescript-eslint/naming-convention -- parser module
export const VisitorKeys = KEYS

// tools
export {
    traverseNodes,
    getStaticJSONValue,
    isExpression,
    isNumberIdentifier,
    isUndefinedIdentifier,
}

/**
 * Parse JSON source code
 */
export function parseJSON(
    code: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- any
    options?: any,
): AST.JSONProgram {
    const parserOptions = Object.assign(
        { filePath: "<input>", ecmaVersion: 2019 },
        options || {},
    )

    return parseForESLint(code, parserOptions).ast as never
}

// types
export { AST }
