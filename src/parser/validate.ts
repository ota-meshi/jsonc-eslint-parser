import type {
    Node,
    ObjectExpression,
    Property,
    ArrayExpression,
    Literal,
    Identifier,
    UnaryExpression,
    TemplateLiteral,
    TemplateElement,
} from "estree"
import type * as eslintUtils from "eslint-utils"
import {
    throwUnexpectedNodeError,
    throwExpectedTokenError,
    throwUnexpectedTokenError,
    throwInvalidNumberError,
    throwUnexpectedSpaceError,
    throwUnexpectedError,
} from "./errors"
import type { TokenStore, MaybeNodeOrToken } from "./token-store"
import { isComma } from "./token-store"
import { requireFromCwd, requireFromLinter } from "./require-utils"
import { isRegExpLiteral } from "./utils"
import type { JSONIdentifier } from "./ast"

const lineBreakPattern = /\r\n|[\n\r\u2028\u2029]/u
const octalNumericLiteralPattern = /^0[Oo]/u
const legacyOctalNumericLiteralPattern = /^0\d/u
const binaryNumericLiteralPattern = /^0[Bb]/u

let cacheCodePointEscapeMatcher: eslintUtils.PatternMatcher | null

/** Get codePointEscape matcher */
function getCodePointEscapeMatcher(): eslintUtils.PatternMatcher {
    if (!cacheCodePointEscapeMatcher) {
        const utils: typeof eslintUtils =
            requireFromCwd("eslint-utils") ||
            requireFromLinter("eslint-utils") ||
            // eslint-disable-next-line @typescript-eslint/no-require-imports -- special require
            require("eslint-utils")
        cacheCodePointEscapeMatcher = new utils.PatternMatcher(
            /\\u\{[\dA-Fa-f]+\}/gu,
        )
    }
    return cacheCodePointEscapeMatcher
}

export type JSONSyntaxContext = {
    trailingCommas: boolean
    comments: boolean
    // invalid JSON numbers
    plusSigns: boolean
    spacedSigns: boolean
    leadingOrTrailingDecimalPoints: boolean
    infinities: boolean
    nans: boolean
    numericSeparators: boolean
    binaryNumericLiterals: boolean
    octalNumericLiterals: boolean
    legacyOctalNumericLiterals: boolean
    invalidJsonNumbers: boolean
    // statics
    multilineStrings: boolean
    unquoteProperties: boolean
    singleQuotes: boolean
    numberProperties: boolean
    undefinedKeywords: boolean
    sparseArrays: boolean
    regExpLiterals: boolean
    templateLiterals: boolean
    bigintLiterals: boolean
    unicodeCodepointEscapes: boolean
    escapeSequenceInIdentifier: boolean
    // JS-likes
    // staticExpression: boolean
}

/**
 * Validate ES node
 */
export function validateNode(
    node: Node,
    tokens: TokenStore,
    ctx: JSONSyntaxContext,
): void {
    if (node.type === "ObjectExpression") {
        validateObjectExpressionNode(node, tokens, ctx)
        return
    }
    if (node.type === "Property") {
        validatePropertyNode(node, tokens, ctx)
        return
    }
    if (node.type === "ArrayExpression") {
        validateArrayExpressionNode(node, tokens, ctx)
        return
    }
    if (node.type === "Literal") {
        validateLiteralNode(node, tokens, ctx)
        return
    }
    if (node.type === "UnaryExpression") {
        validateUnaryExpressionNode(node, tokens, ctx)
        return
    }
    if (node.type === "Identifier") {
        validateIdentifierNode(node, tokens, ctx)
        return
    }
    if (node.type === "TemplateLiteral") {
        validateTemplateLiteralNode(node, tokens, ctx)
        return
    }
    if (node.type === "TemplateElement") {
        validateTemplateElementNode(node, tokens)
        return
    }

    throw throwUnexpectedNodeError(node, tokens)
}

/**
 * Validate ObjectExpression node
 */
function validateObjectExpressionNode(
    node: ObjectExpression,
    tokens: TokenStore,
    ctx: JSONSyntaxContext,
): void {
    /* istanbul ignore next */
    if (node.type !== "ObjectExpression") {
        throw throwUnexpectedNodeError(node, tokens)
    }

    for (const prop of node.properties) {
        setParent(prop, node)
    }

    if (!ctx.trailingCommas) {
        const token = tokens.getTokenBefore(tokens.getLastToken(node))
        if (token && isComma(token)) {
            throw throwUnexpectedTokenError(",", token)
        }
    }
}

/**
 * Validate Property node
 */
function validatePropertyNode(
    node: Property,
    tokens: TokenStore,
    ctx: JSONSyntaxContext,
): void {
    if (node.type !== "Property") {
        throw throwUnexpectedNodeError(node, tokens)
    }

    setParent(node.key, node)
    setParent(node.value, node)

    if (node.computed) {
        throw throwUnexpectedNodeError(node, tokens)
    }
    if (node.method) {
        throw throwUnexpectedNodeError(node.value, tokens)
    }
    if (node.shorthand) {
        throw throwExpectedTokenError(":", node)
    }
    if (node.kind !== "init") {
        throw throwExpectedTokenError(":", tokens.getFirstToken(node))
    }

    if (node.key.type === "Literal") {
        const keyValueType = typeof node.key.value
        if (keyValueType === "number") {
            if (!ctx.numberProperties) {
                throw throwUnexpectedNodeError(node.key, tokens)
            }
        } else if (keyValueType !== "string") {
            throw throwUnexpectedNodeError(node.key, tokens)
        }
    } else if (node.key.type === "Identifier") {
        if (!ctx.unquoteProperties) {
            throw throwUnexpectedNodeError(node.key, tokens)
        }
    } else {
        throw throwUnexpectedNodeError(node.key, tokens)
    }
    if (node.value.type === "Identifier") {
        if (!isStaticValueIdentifier(node.value, ctx)) {
            throw throwUnexpectedNodeError(node.value, tokens)
        }
    }
}

/**
 * Validate ArrayExpression node
 */
function validateArrayExpressionNode(
    node: ArrayExpression,
    tokens: TokenStore,
    ctx: JSONSyntaxContext,
): void {
    /* istanbul ignore next */
    if (node.type !== "ArrayExpression") {
        throw throwUnexpectedNodeError(node, tokens)
    }

    if (!ctx.trailingCommas) {
        const token = tokens.getTokenBefore(tokens.getLastToken(node))
        if (token && isComma(token)) {
            throw throwUnexpectedTokenError(",", token)
        }
    }
    node.elements.forEach((child, index) => {
        if (!child) {
            if (ctx.sparseArrays) {
                return
            }
            const beforeIndex = index - 1
            const before =
                beforeIndex >= 0
                    ? tokens.getLastToken(node.elements[beforeIndex]!)
                    : tokens.getFirstToken(node)
            throw throwUnexpectedTokenError(
                ",",
                tokens.getTokenAfter(before, isComma)!,
            )
        }
        if (child.type === "Identifier") {
            if (!isStaticValueIdentifier(child, ctx)) {
                throw throwUnexpectedNodeError(child, tokens)
            }
        }
        setParent(child, node)
    })
}

/**
 * Validate Literal node
 */
function validateLiteralNode(
    node: Literal,
    tokens: TokenStore,
    ctx: JSONSyntaxContext,
): void {
    /* istanbul ignore next */
    if (node.type !== "Literal") {
        throw throwUnexpectedNodeError(node, tokens)
    }

    if (isRegExpLiteral(node)) {
        if (!ctx.regExpLiterals) {
            throw throwUnexpectedNodeError(node, tokens)
        }
    } else if (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- bigint
        (node as any).bigint
    ) {
        if (!ctx.bigintLiterals) {
            throw throwUnexpectedNodeError(node, tokens)
        }
    } else {
        validateLiteral(node, ctx)
    }
}

/* eslint-disable complexity -- ignore */
/**
 * Validate literal
 */
function validateLiteral(node: Literal, ctx: JSONSyntaxContext) {
    /* eslint-enable complexity -- ignore */
    const value = node.value
    if (
        (!ctx.invalidJsonNumbers ||
            !ctx.leadingOrTrailingDecimalPoints ||
            !ctx.numericSeparators) &&
        typeof value === "number"
    ) {
        const text = node.raw!
        if (!ctx.leadingOrTrailingDecimalPoints) {
            if (text.startsWith(".")) {
                throw throwUnexpectedTokenError(".", node)
            }
            if (text.endsWith(".")) {
                throw throwUnexpectedTokenError(".", {
                    range: [node.range![1] - 1, node.range![1]],
                    loc: {
                        start: {
                            line: node.loc!.end.line,
                            column: node.loc!.end.column - 1,
                        },
                        end: node.loc!.end,
                    },
                })
            }
        }
        if (!ctx.numericSeparators) {
            if (text.includes("_")) {
                const index = text.indexOf("_")
                throw throwUnexpectedTokenError("_", {
                    range: [node.range![0] + index, node.range![0] + index + 1],
                    loc: {
                        start: {
                            line: node.loc!.start.line,
                            column: node.loc!.start.column + index,
                        },
                        end: {
                            line: node.loc!.start.line,
                            column: node.loc!.start.column + index + 1,
                        },
                    },
                })
            }
        }
        if (!ctx.octalNumericLiterals) {
            if (octalNumericLiteralPattern.test(text)) {
                throw throwUnexpectedError("octal numeric literal", node)
            }
        }
        if (!ctx.legacyOctalNumericLiterals) {
            if (legacyOctalNumericLiteralPattern.test(text)) {
                throw throwUnexpectedError("legacy octal numeric literal", node)
            }
        }
        if (!ctx.binaryNumericLiterals) {
            if (binaryNumericLiteralPattern.test(text)) {
                throw throwUnexpectedError("binary numeric literal", node)
            }
        }
        if (!ctx.invalidJsonNumbers) {
            try {
                JSON.parse(text)
            } catch {
                throw throwInvalidNumberError(text, node)
            }
        }
    }
    if (
        (!ctx.multilineStrings ||
            !ctx.singleQuotes ||
            !ctx.unicodeCodepointEscapes) &&
        typeof value === "string"
    ) {
        if (!ctx.singleQuotes) {
            if (node.raw!.startsWith("'")) {
                throw throwUnexpectedError("single quoted", node)
            }
        }
        if (!ctx.multilineStrings) {
            if (lineBreakPattern.test(node.raw!)) {
                throw throwUnexpectedError("multiline string", node)
            }
        }
        if (!ctx.unicodeCodepointEscapes) {
            if (getCodePointEscapeMatcher().test(node.raw!)) {
                throw throwUnexpectedError("unicode codepoint escape", node)
            }
        }
    }

    return undefined
}

/**
 * Validate UnaryExpression node
 */
function validateUnaryExpressionNode(
    node: UnaryExpression,
    tokens: TokenStore,
    ctx: JSONSyntaxContext,
): void {
    /* istanbul ignore next */
    if (node.type !== "UnaryExpression") {
        throw throwUnexpectedNodeError(node, tokens)
    }
    const operator = node.operator

    if (operator === "+") {
        if (!ctx.plusSigns) {
            throw throwUnexpectedTokenError("+", node)
        }
    } else if (operator !== "-") {
        throw throwUnexpectedNodeError(node, tokens)
    }
    const argument = node.argument
    if (argument.type === "Literal") {
        if (typeof argument.value !== "number") {
            throw throwUnexpectedNodeError(argument, tokens)
        }
    } else if (argument.type === "Identifier") {
        if (!isNumberIdentifier(argument, ctx)) {
            throw throwUnexpectedNodeError(argument, tokens)
        }
    } else {
        throw throwUnexpectedNodeError(argument, tokens)
    }
    if (!ctx.spacedSigns) {
        if (node.range![0] + 1 < argument.range![0]) {
            throw throwUnexpectedSpaceError(tokens.getFirstToken(node))
        }
    }

    setParent(argument, node)
}

/**
 * Validate Identifier node
 */
function validateIdentifierNode(
    node: Identifier,
    tokens: TokenStore,
    ctx: JSONSyntaxContext,
): void {
    /* istanbul ignore next */
    if (node.type !== "Identifier") {
        throw throwUnexpectedNodeError(node, tokens)
    }

    if (!ctx.escapeSequenceInIdentifier) {
        if (node.name.length < node.range![1] - node.range![0]) {
            throw throwUnexpectedError("escape sequence", node)
        }
    }
}

/**
 * Validate TemplateLiteral node
 */
function validateTemplateLiteralNode(
    node: TemplateLiteral,
    tokens: TokenStore,
    ctx: JSONSyntaxContext,
): void {
    /* istanbul ignore next */
    if (node.type !== "TemplateLiteral") {
        throw throwUnexpectedNodeError(node, tokens)
    }
    if (!ctx.templateLiterals) {
        throw throwUnexpectedNodeError(node, tokens)
    }
    if (node.expressions.length) {
        const token = tokens.getFirstToken(node.quasis[0])
        const loc: MaybeNodeOrToken = {
            loc: {
                start: {
                    line: token.loc.end.line,
                    column: token.loc.end.column - 2,
                },
                end: token.loc.end,
            },
            range: [token.range[1] - 2, token.range[1]],
        }
        throw throwUnexpectedTokenError("$", loc)
    }

    if (!ctx.unicodeCodepointEscapes) {
        if (getCodePointEscapeMatcher().test(node.quasis[0].value.raw)) {
            throw throwUnexpectedError("unicode codepoint escape", node)
        }
    }
    for (const q of node.quasis) {
        setParent(q, node)
    }
}

/**
 * Validate TemplateElement node
 */
function validateTemplateElementNode(
    node: TemplateElement,
    tokens: TokenStore,
): void {
    /* istanbul ignore next */
    if (node.type !== "TemplateElement") {
        throw throwUnexpectedNodeError(node, tokens)
    }
    const { cooked } = node.value
    if (cooked == null) {
        throw throwUnexpectedNodeError(node, tokens)
    }
    const startOffset = -1
    const endOffset = node.tail ? 1 : 2

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
    ;(node as any).start += startOffset
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
    ;(node as any).end += endOffset

    node.range![0] += startOffset
    node.range![1] += endOffset

    node.loc!.start.column += startOffset
    node.loc!.end.column += endOffset
}

/**
 * Check if given node is NaN or Infinity or undefined
 */
export function isStaticValueIdentifier<I extends Identifier | JSONIdentifier>(
    node: I,
    ctx: JSONSyntaxContext,
): node is I & { name: "NaN" | "Infinity" | "undefined" } {
    if (isNumberIdentifier(node, ctx)) {
        return true
    }
    return node.name === "undefined" && ctx.undefinedKeywords
}

/**
 * Check if given node is NaN or Infinity
 */
function isNumberIdentifier<I extends Identifier | JSONIdentifier>(
    node: I,
    ctx: JSONSyntaxContext,
): node is I & { name: "NaN" | "Infinity" } {
    if (node.name === "Infinity" && ctx.infinities) {
        return true
    }
    if (node.name === "NaN" && ctx.nans) {
        return true
    }
    return false
}

/** Set parent node */
function setParent(prop: Node, parent: Node) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
    ;(prop as any).parent = parent
}
