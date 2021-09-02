import type {
    Node,
    RegExpLiteral,
    Program,
    ObjectExpression,
    Property,
    ArrayExpression,
    Literal,
    Identifier,
    UnaryExpression,
    TemplateLiteral,
    TemplateElement,
    Expression,
} from "estree"
import type { AST } from "eslint"
import type * as eslintUtils from "eslint-utils"
import type {
    JSONNode,
    JSONProgram,
    JSONExpressionStatement,
    JSONObjectExpression,
    JSONProperty,
    JSONArrayExpression,
    JSONExpression,
    JSONLiteral,
    JSONIdentifier,
    Locations,
    JSONUnaryExpression,
    JSONNumberIdentifier,
    JSONNumberLiteral,
    JSONTemplateLiteral,
    JSONTemplateElement,
    JSONRegExpLiteral,
    JSONBigIntLiteral,
    JSONKeywordLiteral,
    JSONStringLiteral,
} from "./ast"
import { getKeys, getNodes } from "./traverse"
import type { ParseError } from "./errors"
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
    //
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
}

export function convertNode(
    node: Program,
    tokens: TokenStore,
    ctx: JSONSyntaxContext,
): JSONProgram
export function convertNode(
    node: ObjectExpression,
    tokens: TokenStore,
    ctx: JSONSyntaxContext,
): JSONObjectExpression
export function convertNode(
    node: ArrayExpression,
    tokens: TokenStore,
    ctx: JSONSyntaxContext,
): JSONArrayExpression
export function convertNode(
    node: Literal,
    tokens: TokenStore,
    ctx: JSONSyntaxContext,
): JSONLiteral
export function convertNode(
    node: UnaryExpression,
    tokens: TokenStore,
    ctx: JSONSyntaxContext,
): JSONUnaryExpression
export function convertNode(
    node: Identifier,
    tokens: TokenStore,
    ctx: JSONSyntaxContext,
): JSONIdentifier
export function convertNode(
    node: TemplateLiteral,
    tokens: TokenStore,
    ctx: JSONSyntaxContext,
): JSONTemplateLiteral
export function convertNode(
    node: Expression,
    tokens: TokenStore,
    ctx: JSONSyntaxContext,
): JSONExpression
export function convertNode(
    node: Node,
    tokens: TokenStore,
    ctx: JSONSyntaxContext,
): JSONNode
/**
 * Convert ES node to JSON node
 */
export function convertNode(
    node: Node,
    tokens: TokenStore,
    ctx: JSONSyntaxContext,
): JSONNode {
    if (node.type === "Program") {
        return convertProgramNode(node, tokens, ctx)
    }
    if (node.type === "ObjectExpression") {
        return convertObjectExpressionNode(node, tokens, ctx)
    }
    if (node.type === "ArrayExpression") {
        return convertArrayExpressionNode(node, tokens, ctx)
    }
    if (node.type === "Literal") {
        return convertLiteralNode(node, tokens, ctx)
    }
    if (node.type === "UnaryExpression") {
        return convertUnaryExpressionNode(node, tokens, ctx)
    }
    if (node.type === "Identifier") {
        return convertIdentifierNode(node, tokens, ctx)
    }
    if (node.type === "TemplateLiteral") {
        return convertTemplateLiteralNode(node, tokens, ctx)
    }
    return throwUnexpectedNodeError(node, tokens)
}

/**
 * Convert ES token to JSON token
 */
export function convertToken(token: AST.Token): AST.Token {
    if (token.type === "Punctuator") {
        if (token.value === "(" || token.value === ")") {
            return throwUnexpectedTokenError(token.value, token)
        }
    }
    return {
        type: token.type,
        value: token.value,
        ...getFixLocation(token),
    }
}

/**
 * Convert Program node to JSONProgram node
 */
function convertProgramNode(
    node: Program,
    tokens: TokenStore,
    ctx: JSONSyntaxContext,
): JSONProgram {
    /* istanbul ignore next */
    if (node.type !== "Program") {
        return throwUnexpectedNodeError(node, tokens)
    }
    const bodyNode = node.body[0]
    if (bodyNode.type !== "ExpressionStatement") {
        return throwUnexpectedNodeError(bodyNode, tokens)
    }
    const expression = bodyNode.expression
    if (expression.type === "Identifier") {
        if (!isStaticValueIdentifier(expression, ctx)) {
            return throwUnexpectedNodeError(expression, tokens)
        }
    }
    const body: JSONExpressionStatement = {
        type: "JSONExpressionStatement",
        expression: convertNode(expression, tokens, ctx),
        ...getFixLocation(bodyNode),
        parent: null as never,
    }

    const nn: JSONProgram = {
        type: "Program",
        body: [body],
        comments: [],
        tokens: [],
        ...getFixLocation(node),
        parent: null as never,
    }
    return nn
}

/**
 * Convert ObjectExpression node to JSONObjectExpression node
 */
function convertObjectExpressionNode(
    node: ObjectExpression,
    tokens: TokenStore,
    ctx: JSONSyntaxContext,
): JSONObjectExpression {
    /* istanbul ignore next */
    if (node.type !== "ObjectExpression") {
        return throwUnexpectedNodeError(node, tokens)
    }

    if (!ctx.trailingCommas) {
        const token = tokens.getTokenBefore(tokens.getLastToken(node))
        if (token && isComma(token)) {
            return throwUnexpectedTokenError(",", token)
        }
    }

    const nn: JSONObjectExpression = {
        type: "JSONObjectExpression",
        properties: node.properties.map((p) =>
            convertPropertyNode(p as Property, tokens, ctx),
        ),
        ...getFixLocation(node),
        parent: null as never,
    }
    checkUnexpectedKeys(node, tokens, nn)
    return nn
}

/**
 * Convert Property node to JSONProperty node
 */
function convertPropertyNode(
    node: Property,
    tokens: TokenStore,
    ctx: JSONSyntaxContext,
): JSONProperty {
    if (node.type !== "Property") {
        return throwUnexpectedNodeError(node, tokens)
    }

    if (node.computed) {
        return throwUnexpectedNodeError(node, tokens)
    }
    if (node.method) {
        return throwUnexpectedNodeError(node.value, tokens)
    }
    if (node.shorthand) {
        return throwExpectedTokenError(":", node)
    }
    if (node.kind !== "init") {
        return throwExpectedTokenError(":", tokens.getFirstToken(node))
    }
    if (node.key.type === "Literal") {
        const keyValueType = typeof node.key.value
        if (keyValueType === "number") {
            if (!ctx.numberProperties) {
                return throwUnexpectedNodeError(node.key, tokens)
            }
        } else if (keyValueType !== "string") {
            return throwUnexpectedNodeError(node.key, tokens)
        }
    } else if (node.key.type === "Identifier") {
        if (!ctx.unquoteProperties) {
            return throwUnexpectedNodeError(node.key, tokens)
        }
    } else {
        return throwUnexpectedNodeError(node.key, tokens)
    }
    if (node.value.type === "Identifier") {
        if (!isStaticValueIdentifier(node.value, ctx)) {
            return throwUnexpectedNodeError(node.value, tokens)
        }
    }
    const nn: JSONProperty = {
        type: "JSONProperty",
        key: convertNode(node.key, tokens, ctx) as
            | JSONStringLiteral
            | JSONNumberLiteral
            | JSONIdentifier,
        value: convertNode(node.value, tokens, ctx) as JSONExpression,
        kind: node.kind,
        computed: node.computed,
        method: node.method,
        shorthand: node.shorthand,
        ...getFixLocation(node),
        parent: null as never,
    }
    checkUnexpectedKeys(node, tokens, nn)
    return nn
}

/**
 * Convert ArrayExpression node to JSONArrayExpression node
 */
function convertArrayExpressionNode(
    node: ArrayExpression,
    tokens: TokenStore,
    ctx: JSONSyntaxContext,
): JSONArrayExpression {
    /* istanbul ignore next */
    if (node.type !== "ArrayExpression") {
        return throwUnexpectedNodeError(node, tokens)
    }
    if (!ctx.trailingCommas) {
        const token = tokens.getTokenBefore(tokens.getLastToken(node))
        if (token && isComma(token)) {
            return throwUnexpectedTokenError(",", token)
        }
    }
    const elements = node.elements.map((child, index) => {
        if (!child) {
            if (ctx.sparseArrays) {
                return null
            }
            const beforeIndex = index - 1
            const before =
                beforeIndex >= 0
                    ? tokens.getLastToken(node.elements[beforeIndex]!)
                    : tokens.getFirstToken(node)
            return throwUnexpectedTokenError(
                ",",
                tokens.getTokenAfter(before, isComma)!,
            )
        }
        if (child.type === "Identifier") {
            if (!isStaticValueIdentifier(child, ctx)) {
                return throwUnexpectedNodeError(child, tokens)
            }
        }
        return convertNode(child, tokens, ctx) as JSONExpression
    })
    const nn: JSONArrayExpression = {
        type: "JSONArrayExpression",
        elements,
        ...getFixLocation(node),
        parent: null as never,
    }
    checkUnexpectedKeys(node, tokens, nn)
    return nn
}

/**
 * Check if the given node is RegExpLiteral
 */
function isRegExpLiteral(node: Literal): node is RegExpLiteral {
    return Boolean((node as RegExpLiteral).regex)
}

/**
 * Convert Literal node to JSONLiteral node
 */
function convertLiteralNode(
    node: Literal,
    tokens: TokenStore,
    ctx: JSONSyntaxContext,
): JSONLiteral {
    /* istanbul ignore next */
    if (node.type !== "Literal") {
        return throwUnexpectedNodeError(node, tokens)
    }

    let nn: JSONLiteral
    if (isRegExpLiteral(node)) {
        if (!ctx.regExpLiterals) {
            return throwUnexpectedNodeError(node, tokens)
        }
        nn = {
            type: "JSONLiteral",
            value: node.value,
            raw: node.raw!,
            regex: node.regex,
            ...getFixLocation(node),
        } as JSONRegExpLiteral
    } else if (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- bigint
        (node as any).bigint
    ) {
        if (!ctx.bigintLiterals) {
            return throwUnexpectedNodeError(node, tokens)
        }
        nn = {
            type: "JSONLiteral",
            value: node.value,
            raw: node.raw!,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- bigint
            bigint: (node as any).bigint,
            ...getFixLocation(node),
        } as JSONBigIntLiteral
    } else {
        validateLiteral(node, ctx)
        const value = node.value

        nn = {
            type: "JSONLiteral",
            value,
            raw: node.raw!,
            ...getFixLocation(node),
        } as JSONStringLiteral | JSONNumberLiteral | JSONKeywordLiteral
    }
    checkUnexpectedKeys(node, tokens, nn)
    return nn
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
                return throwUnexpectedTokenError(".", node)
            }
            if (text.endsWith(".")) {
                return throwUnexpectedTokenError(".", {
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
                return throwUnexpectedTokenError("_", {
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
                return throwUnexpectedError("octal numeric literal", node)
            }
        }
        if (!ctx.legacyOctalNumericLiterals) {
            if (legacyOctalNumericLiteralPattern.test(text)) {
                return throwUnexpectedError(
                    "legacy octal numeric literal",
                    node,
                )
            }
        }
        if (!ctx.binaryNumericLiterals) {
            if (binaryNumericLiteralPattern.test(text)) {
                return throwUnexpectedError("binary numeric literal", node)
            }
        }
        if (!ctx.invalidJsonNumbers) {
            try {
                JSON.parse(text)
            } catch {
                return throwInvalidNumberError(text, node)
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
                return throwUnexpectedError("single quoted", node)
            }
        }
        if (!ctx.multilineStrings) {
            if (lineBreakPattern.test(node.raw!)) {
                return throwUnexpectedError("multiline string", node)
            }
        }
        if (!ctx.unicodeCodepointEscapes) {
            if (getCodePointEscapeMatcher().test(node.raw!)) {
                return throwUnexpectedError("unicode codepoint escape", node)
            }
        }
    }

    return undefined
}

/**
 * Convert UnaryExpression node to JSONUnaryExpression node
 */
function convertUnaryExpressionNode(
    node: UnaryExpression,
    tokens: TokenStore,
    ctx: JSONSyntaxContext,
): JSONUnaryExpression {
    /* istanbul ignore next */
    if (node.type !== "UnaryExpression") {
        return throwUnexpectedNodeError(node, tokens)
    }
    const operator = node.operator

    if (operator === "+") {
        if (!ctx.plusSigns) {
            return throwUnexpectedTokenError("+", node)
        }
    } else if (operator !== "-") {
        return throwUnexpectedNodeError(node, tokens)
    }
    const argument = node.argument
    if (argument.type === "Literal") {
        if (typeof argument.value !== "number") {
            return throwUnexpectedNodeError(argument, tokens)
        }
    } else if (argument.type === "Identifier") {
        if (!isNumberIdentifier(argument, ctx)) {
            return throwUnexpectedNodeError(argument, tokens)
        }
    } else {
        return throwUnexpectedNodeError(argument, tokens)
    }
    if (!ctx.spacedSigns) {
        if (node.range![0] + 1 < argument.range![0]) {
            return throwUnexpectedSpaceError(tokens.getFirstToken(node))
        }
    }

    const nn: JSONUnaryExpression = {
        type: "JSONUnaryExpression",
        operator,
        prefix: node.prefix,
        argument: convertNode(argument, tokens, ctx) as
            | JSONNumberLiteral
            | JSONNumberIdentifier,
        ...getFixLocation(node),
        parent: null as never,
    }
    checkUnexpectedKeys(node, tokens, nn)
    return nn
}

/**
 * Convert Identifier node to JSONIdentifier node
 */
function convertIdentifierNode(
    node: Identifier,
    tokens: TokenStore,
    ctx: JSONSyntaxContext,
): JSONIdentifier {
    /* istanbul ignore next */
    if (node.type !== "Identifier") {
        return throwUnexpectedNodeError(node, tokens)
    }

    if (!ctx.escapeSequenceInIdentifier) {
        if (node.name.length < node.range![1] - node.range![0]) {
            return throwUnexpectedError("escape sequence", node)
        }
    }
    const nn: JSONIdentifier = {
        type: "JSONIdentifier",
        name: node.name,
        ...getFixLocation(node),
    }
    checkUnexpectedKeys(node, tokens, nn)
    return nn
}

/**
 * Convert TemplateLiteral node to JSONTemplateLiteral node
 */
function convertTemplateLiteralNode(
    node: TemplateLiteral,
    tokens: TokenStore,
    ctx: JSONSyntaxContext,
): JSONTemplateLiteral {
    /* istanbul ignore next */
    if (node.type !== "TemplateLiteral") {
        return throwUnexpectedNodeError(node, tokens)
    }
    if (!ctx.templateLiterals) {
        return throwUnexpectedNodeError(node, tokens)
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
        return throwUnexpectedTokenError("$", loc)
    }

    if (!ctx.unicodeCodepointEscapes) {
        if (getCodePointEscapeMatcher().test(node.quasis[0].value.raw)) {
            return throwUnexpectedError("unicode codepoint escape", node)
        }
    }
    const quasis: [JSONTemplateElement] = [
        convertTemplateElementNode(node.quasis[0], tokens),
    ]

    const nn: JSONTemplateLiteral = {
        type: "JSONTemplateLiteral",
        quasis,
        expressions: [],
        ...getFixLocation(node),
        parent: null as never,
    }
    checkUnexpectedKeys(node, tokens, nn)
    return nn
}

/**
 * Convert TemplateElement node to JSONTemplateElement node
 */
function convertTemplateElementNode(
    node: TemplateElement,
    tokens: TokenStore,
): JSONTemplateElement {
    /* istanbul ignore next */
    if (node.type !== "TemplateElement") {
        return throwUnexpectedNodeError(node, tokens)
    }
    const { cooked, raw } = node.value
    if (cooked == null) {
        return throwUnexpectedNodeError(node, tokens)
    }

    const nn: JSONTemplateElement = {
        type: "JSONTemplateElement",
        tail: node.tail,
        value: { raw, cooked },
        ...getFixLocation(node),
        parent: null as never,
    }
    checkUnexpectedKeys(node, tokens, nn)
    return nn
}

/**
 * Check if given node is NaN or Infinity or undefined
 */
function isStaticValueIdentifier(
    node: Identifier,
    ctx: JSONSyntaxContext,
): node is Identifier & { name: "NaN" | "Infinity" | "undefined" } {
    if (isNumberIdentifier(node, ctx)) {
        return true
    }
    return node.name === "undefined" && ctx.undefinedKeywords
}

/**
 * Check if given node is NaN or Infinity
 */
function isNumberIdentifier(
    node: Identifier,
    ctx: JSONSyntaxContext,
): node is Identifier & { name: "NaN" | "Infinity" } {
    if (node.name === "Infinity" && ctx.infinities) {
        return true
    }
    if (node.name === "NaN" && ctx.nans) {
        return true
    }
    return false
}

/**
 * Check unknown keys
 */
function checkUnexpectedKeys(
    node: Node,
    tokens: TokenStore,
    jsonNode: JSONNode,
) {
    const keys = getKeys(node as never)
    for (const key of keys) {
        if (!(key in jsonNode)) {
            throwUnexpectedNodeError(
                getNodes(node, key).next().value as never,
                tokens,
            )
        }
    }
}

/**
 * Fix the location information of the given node.
 * @param node The node.
 */
export function fixLocation(node: MaybeNodeOrToken | AST.Token): void {
    const locs = getFixLocation(node)
    node.range = locs.range
    node.loc = locs.loc
}

/**
 * Modify the location information of the given error with using the base offset and gaps of this calculator.
 * @param error The error to modify their location.
 */
export function fixErrorLocation(error: ParseError): void {
    error.index = Math.max(error.index - 2, 0)
    if (error.lineNumber === 0) {
        error.column = Math.max(error.column - 2, 0)
    }
}

/**
 * Get the location information of the given node.
 * @param node The node.
 */
export function getFixLocation(node: MaybeNodeOrToken | AST.Token): Locations {
    const range = node.range!
    const loc = node.loc!

    return {
        range: [Math.max(range[0] - 2, 0), Math.max(range[1] - 2, 0)],
        loc: {
            start: {
                line: loc.start.line,
                column:
                    loc.start.line === 1
                        ? Math.max(loc.start.column - 2, 0)
                        : loc.start.column,
            },
            end: {
                line: loc.end.line,
                column:
                    loc.end.line === 1
                        ? Math.max(loc.end.column - 2, 0)
                        : loc.end.column,
            },
        },
    }
}
