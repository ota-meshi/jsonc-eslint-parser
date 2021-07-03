import type { ExpressionStatement, CallExpression } from "estree"
import type { AST, SourceCode } from "eslint"
import type { ESPree } from "./espree"
import { getEspree } from "./espree"
import {
    ParseError,
    throwEmptyError,
    throwUnexpectedTokenError,
    throwErrorAsAdjustingOutsideOfCode,
    throwUnexpectedCommentError,
} from "./errors"
import { KEYS } from "./visitor-keys"
import type { JSONSyntaxContext } from "./convert"
import {
    convertNode,
    convertToken,
    fixLocation,
    fixErrorLocation,
} from "./convert"
import type { ParserOptions } from "../types"
import { TokenStore, isComma } from "./token-store"
import type { JSONProgram } from "./ast"
import { lte } from "semver"

const DEFAULT_ECMA_VERSION = 2019

/**
 * Parse source code
 */
export function parseForESLint(
    code: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- any
    options?: any,
): {
    ast: JSONProgram
    visitorKeys: SourceCode.VisitorKeys
    services: {
        isJSON: boolean
    }
} {
    const parserOptions = Object.assign(
        { filePath: "<input>", ecmaVersion: DEFAULT_ECMA_VERSION },
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
    try {
        const ast = parseJS(`0(${code}\n)`, parserOptions)

        const tokens = ast.tokens || []
        const tokenStore = new TokenStore(tokens)
        const statement = ast.body[0] as ExpressionStatement
        const callExpression = statement.expression as CallExpression
        const expression = callExpression.arguments[0]

        if (!expression) {
            return throwEmptyError("an expression")
        }
        if (expression && expression.type === "SpreadElement") {
            return throwUnexpectedTokenError("...", expression)
        }
        if (callExpression.arguments[1]) {
            const node = callExpression.arguments[1]
            return throwUnexpectedTokenError(
                ",",
                tokenStore.getTokenBefore(node, isComma)!,
            )
        }

        // Remove parens.
        tokens.shift()
        tokens.shift()
        tokens.pop()
        const last = tokens[tokens.length - 1]

        if (last && isComma(last)) {
            return throwUnexpectedTokenError(",", last)
        }

        ast.range[1] = statement.range![1] = last.range[1]
        ast.loc.end.line = statement.loc!.end.line = last.loc.end.line
        ast.loc.end.column = statement.loc!.end.column = last.loc.end.column
        ast.body = [statement]
        statement.expression = expression

        return {
            ast: postprocess(ast, tokenStore, parserOptions),
            visitorKeys: KEYS,
            services: {
                isJSON: true,
            },
        }
    } catch (err) {
        return throwErrorAsAdjustingOutsideOfCode(err, code)
    }
}

/**
 * Parse the given source code.
 *
 * @param code The source code to parse.
 * @param options The parser options.
 * @returns The result of parsing.
 */
function parseJS(
    code: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- any
    options: any,
): AST.Program {
    const espree = getEspree()
    const ecmaVersion = normalizeEcmaVersion(espree, options.ecmaVersion)
    try {
        return espree.parse(code, {
            ...options,
            ecmaVersion,
        })
    } catch (err) {
        const perr = ParseError.normalize(err)
        if (perr) {
            fixErrorLocation(perr)
            throw perr
        }
        throw err
    }
}

/**
 * Do post-process of parsing an expression.
 *
 * 1. Convert node type.
 * 2. Fix `node.range` and `node.loc` for JSON entities.
 *
 * @param result The parsing result to modify.
 */
function postprocess(
    ast: AST.Program,
    tokenStore: TokenStore,
    options?: ParserOptions,
) {
    const ctx: JSONSyntaxContext = getJSONSyntaxContext(options?.jsonSyntax)
    const jsonAst = convertNode(ast, tokenStore, ctx)

    const tokens = []
    for (const token of ast.tokens || []) {
        tokens.push(convertToken(token))
    }
    const comments = ast.comments || []
    if (!ctx.comments && comments.length > 0) {
        return throwUnexpectedCommentError(comments[0])
    }
    for (const comment of comments) {
        fixLocation(comment)
    }
    jsonAst.tokens = tokens
    jsonAst.comments = comments
    return jsonAst
}

/**
 * Normalize json syntax option
 */
function getJSONSyntaxContext(str?: string | null): JSONSyntaxContext {
    const upperCase = str?.toUpperCase()
    if (upperCase === "JSON") {
        return {
            trailingCommas: false,
            comments: false,
            plusSigns: false,
            spacedSigns: false,
            leadingOrTrailingDecimalPoints: false,
            infinities: false,
            nans: false,
            numericSeparators: false,
            binaryNumericLiterals: false,
            octalNumericLiterals: false,
            legacyOctalNumericLiterals: false,
            invalidJsonNumbers: false,
            multilineStrings: false,
            unquoteProperties: false,
            singleQuotes: false,
            numberProperties: false,
            undefinedKeywords: false,
            sparseArrays: false,
            regExpLiterals: false,
            templateLiterals: false,
            bigintLiterals: false,
            unicodeCodepointEscapes: false,
            escapeSequenceInIdentifier: false,
        }
    }
    if (upperCase === "JSONC") {
        return {
            trailingCommas: true,
            comments: true,
            plusSigns: false,
            spacedSigns: false,
            leadingOrTrailingDecimalPoints: false,
            infinities: false,
            nans: false,
            numericSeparators: false,
            binaryNumericLiterals: false,
            octalNumericLiterals: false,
            legacyOctalNumericLiterals: false,
            invalidJsonNumbers: false,
            multilineStrings: false,
            unquoteProperties: false,
            singleQuotes: false,
            numberProperties: false,
            undefinedKeywords: false,
            sparseArrays: false,
            regExpLiterals: false,
            templateLiterals: false,
            bigintLiterals: false,
            unicodeCodepointEscapes: false,
            escapeSequenceInIdentifier: false,
        }
    }
    if (upperCase === "JSON5") {
        return {
            trailingCommas: true,
            comments: true,
            plusSigns: true,
            spacedSigns: true,
            leadingOrTrailingDecimalPoints: true,
            infinities: true,
            nans: true,
            numericSeparators: false,
            binaryNumericLiterals: false,
            octalNumericLiterals: false,
            legacyOctalNumericLiterals: false,
            invalidJsonNumbers: true,
            multilineStrings: true,
            unquoteProperties: true,
            singleQuotes: true,
            numberProperties: false,
            undefinedKeywords: false,
            sparseArrays: false,
            regExpLiterals: false,
            templateLiterals: false,
            bigintLiterals: false,
            unicodeCodepointEscapes: false,
            escapeSequenceInIdentifier: false,
        }
    }
    return {
        trailingCommas: true,
        comments: true,
        plusSigns: true,
        spacedSigns: true,
        leadingOrTrailingDecimalPoints: true,
        infinities: true,
        nans: true,
        numericSeparators: true,
        binaryNumericLiterals: true,
        octalNumericLiterals: true,
        legacyOctalNumericLiterals: true,
        invalidJsonNumbers: true,
        multilineStrings: true,
        unquoteProperties: true,
        singleQuotes: true,
        numberProperties: true,
        undefinedKeywords: true,
        sparseArrays: true,
        regExpLiterals: true,
        templateLiterals: true,
        bigintLiterals: true,
        unicodeCodepointEscapes: true,
        escapeSequenceInIdentifier: true,
    }
}

/**
 * Normalize ECMAScript version
 */
function normalizeEcmaVersion(
    espree: ESPree,
    version: number | "latest" | undefined,
) {
    if (version == null || version === "latest") {
        return getLatestEcmaVersion(espree)
    }
    if (version > 5 && version < 2015) {
        return version + 2009
    }
    return version
}

/**
 * Get the latest ecma version from espree
 */
function getLatestEcmaVersion(espree: ESPree): number {
    if (espree.latestEcmaVersion == null) {
        for (const { v, latest } of [
            { v: "6.1.0", latest: 2020 },
            { v: "4.0.0", latest: 2019 },
        ]) {
            if (lte(v, espree.version)) {
                return latest
            }
        }
        return 2018
    }
    return normalizeEcmaVersion(espree, espree.latestEcmaVersion)
}
