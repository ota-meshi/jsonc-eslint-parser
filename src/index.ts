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
export function parseJSON(code: string, options?: any): AST.JSONProgram {
    const parserOptions = Object.assign(
        { filePath: "<input>", ecmaVersion: 2019 },
        options || {},
        {
            loc: true,
            range: true,
            raw: true,
            tokens: true,
            comment: true,
            eslintVisitorKeys: true,
            eslintScopeManager: true,
        },
    )

    return parseForESLint(code, parserOptions).ast as never
}

// types
export { AST }
