import type { Position, Node, RegExpLiteral } from "estree"
import { getFixLocation } from "./convert"
import type { TokenStore, MaybeNodeOrToken } from "./token-store"
import type { Comment } from "../types"

/**
 * JSON parse errors.
 */
export class ParseError extends SyntaxError {
    public index: number

    public lineNumber: number

    public column: number

    /**
     * Normalize the error object.
     * @param x The error object to normalize.
     */
    public static normalize(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- any
        x: any,
    ): ParseError | null {
        if (ParseError.isParseError(x)) {
            return x
        }
        if (isAcornStyleParseError(x)) {
            return new ParseError(x.message, x.pos, x.loc.line, x.loc.column)
        }
        return null
    }

    /**
     * Initialize this ParseError instance.
     * @param message The error message.
     * @param code The error code. See also: https://html.spec.whatwg.org/multipage/parsing.html#parse-errors
     * @param offset The offset number of this error.
     * @param line The line number of this error.
     * @param column The column number of this error.
     */
    public constructor(
        message: string,
        offset: number,
        line: number,
        column: number,
    ) {
        super(message)
        this.index = offset
        this.lineNumber = line
        this.column = column
    }

    /**
     * Type guard for ParseError.
     * @param x The value to check.
     * @returns `true` if the value has `message`, `pos`, `loc` properties.
     */
    public static isParseError(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- any
        x: any,
    ): x is ParseError {
        return (
            x instanceof ParseError ||
            (typeof x.message === "string" &&
                typeof x.index === "number" &&
                typeof x.lineNumber === "number" &&
                typeof x.column === "number")
        )
    }
}

/**
 * Throw syntax error for empty.
 */
export function throwEmptyError(expected: string): never {
    const err = new ParseError(
        `Expected to be ${expected}, but got empty.`,
        0,
        1,
        1,
    )

    throw err
}

/**
 * Throw syntax error for expected token.
 * @param name The token name.
 * @param token The token object to get that location.
 */
export function throwExpectedTokenError(
    name: string,
    beforeToken: MaybeNodeOrToken,
): never {
    const locs = getFixLocation(beforeToken)
    const err = new ParseError(
        `Expected token '${name}'.`,
        locs.range[1],
        locs.loc.end.line,
        locs.loc.end.column + 1,
    )

    throw err
}

/**
 * Throw syntax error for unexpected name.
 * @param name The unexpected name.
 * @param token The token object to get that location.
 */
export function throwUnexpectedError(
    name: string,
    token: MaybeNodeOrToken,
): never {
    const locs = getFixLocation(token)
    const err = new ParseError(
        `Unexpected ${name}.`,
        locs.range[0],
        locs.loc.start.line,
        locs.loc.start.column + 1,
    )

    throw err
}

/**
 * Throw syntax error for unexpected token.
 * @param name The token name.
 * @param token The token object to get that location.
 */
export function throwUnexpectedTokenError(
    name: string,
    token: MaybeNodeOrToken,
): never {
    return throwUnexpectedError(`token '${name}'`, token)
}

/**
 * Throw syntax error for unexpected comment.
 * @param name The token name.
 * @param token The token object to get that location.
 */
export function throwUnexpectedCommentError(token: Comment): never {
    return throwUnexpectedError("comment", token)
}

/**
 * Throw syntax error for unexpected whitespace.
 */
export function throwUnexpectedSpaceError(
    beforeToken: MaybeNodeOrToken,
): never {
    const locs = getFixLocation(beforeToken)
    const err = new ParseError(
        "Unexpected whitespace.",
        locs.range[1],
        locs.loc.end.line,
        locs.loc.end.column + 1,
    )

    throw err
}

/**
 * Throw syntax error for unexpected invalid number.
 */
export function throwInvalidNumberError(
    text: string,
    token: MaybeNodeOrToken,
): never {
    const locs = getFixLocation(token)
    const err = new ParseError(
        `Invalid number ${text}.`,
        locs.range[0],
        locs.loc.start.line,
        locs.loc.start.column + 1,
    )

    throw err
}

/**
 * Throw syntax error for unexpected token.
 * @param node The token object to get that location.
 */
export function throwUnexpectedNodeError(
    node: Node,
    tokens: TokenStore,
    offset?: number,
): never {
    if (node.type === "Identifier") {
        const locs = getFixLocation(node)
        const err = new ParseError(
            `Unexpected identifier '${node.name}'.`,
            locs.range[0],
            locs.loc.start.line,
            locs.loc.start.column + 1,
        )
        throw err
    }
    if (node.type === "Literal") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- bigint
        const type = (node as any).bigint
            ? "bigint"
            : (node as RegExpLiteral).regex
            ? "regex"
            : node.value === null
            ? "null"
            : typeof node.value
        const locs = getFixLocation(node)
        const err = new ParseError(
            `Unexpected ${type} literal.`,
            locs.range[0],
            locs.loc.start.line,
            locs.loc.start.column + 1,
        )
        throw err
    }
    if (node.type === "TemplateLiteral") {
        const locs = getFixLocation(node)
        const err = new ParseError(
            "Unexpected template literal.",
            locs.range[0],
            locs.loc.start.line,
            locs.loc.start.column + 1,
        )
        throw err
    }
    if (
        node.type.endsWith("Expression") &&
        node.type !== "FunctionExpression"
    ) {
        const name = node.type.replace(/\B([A-Z])/gu, " $1").toLowerCase()
        const locs = getFixLocation(node)
        const err = new ParseError(
            `Unexpected ${name}.`,
            locs.range[0],
            locs.loc.start.line,
            locs.loc.start.column + 1,
        )
        throw err
    }
    const index = node.range![0] + (offset || 0)
    const t = tokens.findTokenByOffset(index)
    const name = t?.value || "unknown"
    const locs = getFixLocation(t || node)
    const err = new ParseError(
        `Unexpected token '${name}'.`,
        locs.range[0],
        locs.loc.start.line,
        locs.loc.start.column + 1,
    )

    throw err
}

/**
 * Throw syntax error of outside of code.
 */
export function throwErrorAsAdjustingOutsideOfCode(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- any
    err: any,
    code: string,
): never {
    if (ParseError.isParseError(err)) {
        const endOffset = code.length
        if (err.index >= endOffset) {
            err.message = "Unexpected end of expression."
        }
    }

    throw err
}

/**
 * Check whether the given value has acorn style location information.
 * @param x The value to check.
 * @returns `true` if the value has acorn style location information.
 */
function isAcornStyleParseError(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- any
    x: any,
): x is { message: string; pos: number; loc: Position } {
    return (
        typeof x.message === "string" &&
        typeof x.pos === "number" &&
        typeof x.loc === "object" &&
        x.loc !== null &&
        typeof x.loc.line === "number" &&
        typeof x.loc.column === "number"
    )
}
