import type { Node } from "estree"
import type { AST } from "eslint"
import type {
    JSONNode,
    JSONProgram,
    JSONExpressionStatement,
    Locations,
} from "./ast"
import type { TokenStore } from "./token-store"
import type { Token as AcornToken, tokTypes as AcornTokTypes } from "acorn"
import { isStaticValueIdentifier } from "./validate"
import { throwUnexpectedNodeError, throwUnexpectedTokenError } from "./errors"
import { getAcorn } from "./modules/acorn"
import type { JSONSyntaxContext } from "./syntax-context"

export class TokenConvertor {
    private readonly ctx: JSONSyntaxContext

    private readonly code: string

    private readonly templateBuffer: AcornToken[] = []

    private readonly tokTypes: typeof AcornTokTypes

    public constructor(ctx: JSONSyntaxContext, code: string) {
        this.ctx = ctx
        this.code = code
        this.tokTypes = getAcorn().tokTypes
    }

    // eslint-disable-next-line complexity -- X
    public convertToken(token: AcornToken): AST.Token | null {
        const { tokTypes } = this
        let type: AST.Token["type"], value: string
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
        const additional: any = {}
        if (token.type === tokTypes.string) {
            type = "String"
            value = this.code.slice(...token.range!)
        } else if (token.type === tokTypes.num) {
            type = "Numeric"
            value = this.code.slice(...token.range!)
        } else if (token.type.keyword) {
            if (
                token.type.keyword === "true" ||
                token.type.keyword === "false"
            ) {
                type = "Boolean"
            } else if (token.type.keyword === "null") {
                type = "Null"
            } else {
                type = "Keyword"
            }
            value = token.value
        } else if (
            token.type === tokTypes.braceL ||
            token.type === tokTypes.braceR ||
            token.type === tokTypes.bracketL ||
            token.type === tokTypes.bracketR ||
            token.type === tokTypes.colon ||
            token.type === tokTypes.comma ||
            token.type === tokTypes.plusMin
        ) {
            type = "Punctuator"
            value = this.code.slice(...token.range!)
        } else if (token.type === tokTypes.name) {
            type = "Identifier"
            value = token.value
        } else if (token.type === tokTypes.backQuote) {
            if (this.templateBuffer.length > 0) {
                const first = this.templateBuffer[0]
                this.templateBuffer.length = 0
                return {
                    type: "Template" as never,
                    value: this.code.slice(first.start, token.end),
                    range: [first.start, token.end],
                    loc: {
                        start: first.loc!.start,
                        end: token.loc!.end,
                    },
                }
            }
            this.templateBuffer.push(token)
            return null
        } else if (token.type === tokTypes.template) {
            if (this.templateBuffer.length === 0) {
                return throwUnexpectedTokenError(
                    this.code.slice(...token.range!),
                    token,
                )
            }
            this.templateBuffer.push(token)
            return null
        } else if (token.type === tokTypes.regexp) {
            const reValue = token.value
            type = "RegularExpression"
            additional.regex = {
                flags: reValue.flags,
                pattern: reValue.pattern,
            }
            value = `/${reValue.pattern}/${reValue.flags}`
        } else if (
            this.ctx.parentheses &&
            (token.type === tokTypes.parenL || token.type === tokTypes.parenR)
        ) {
            type = "Punctuator"
            value = this.code.slice(...token.range!)
        } else if (
            this.ctx.staticExpressions &&
            (token.type === tokTypes.star ||
                token.type === tokTypes.slash ||
                token.type === tokTypes.modulo ||
                token.type === tokTypes.starstar)
        ) {
            type = "Punctuator"
            value = this.code.slice(...token.range!)
        } else {
            // const key = Object.keys(tokTypes).find(
            //     (k) => tokTypes[k] === token.type,
            // )
            // if (
            //     key &&
            //     key !== "ellipsis" &&
            //     key !== "parenL" &&
            //     key !== "_typeof" &&
            //     key !== "_null" &&
            //     key !== "dollarBraceL"
            // ) {
            //     console.log(key, this.code.slice(...token.range!))
            //     debugger
            // }
            return throwUnexpectedTokenError(
                this.code.slice(...token.range!),
                token,
            )
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
        ;(token as any).type = type
        token.value = value
        for (const k in additional) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
            ;(token as any)[k] = additional[k]
        }
        return token as never
    }
}

/**
 * Convert root expression node to JSONProgram node
 */
export function convertProgramNode(
    node: Node | JSONNode,
    tokens: TokenStore,
    ctx: JSONSyntaxContext,
    code: string,
): JSONProgram {
    /* istanbul ignore next */
    if (
        node.type !== "JSONObjectExpression" &&
        node.type !== "JSONArrayExpression" &&
        node.type !== "JSONLiteral" &&
        node.type !== "JSONUnaryExpression" &&
        node.type !== "JSONIdentifier" &&
        node.type !== "JSONTemplateLiteral" &&
        node.type !== "JSONBinaryExpression"
    ) {
        return throwUnexpectedNodeError(node, tokens)
    }
    if (node.type === "JSONIdentifier") {
        if (!isStaticValueIdentifier(node, ctx)) {
            return throwUnexpectedNodeError(node, tokens)
        }
    }
    const body: JSONExpressionStatement = {
        type: "JSONExpressionStatement",
        expression: node,
        ...cloneLocation(node),
        parent: null as never,
    }

    setParent(node, body)

    const end = code.length
    const endLoc = getAcorn().getLineInfo(code, end)
    const nn: JSONProgram = {
        type: "Program",
        body: [body],
        comments: [],
        tokens: [],
        range: [0, end],
        loc: {
            start: {
                line: 1,
                column: 0,
            },
            end: {
                line: endLoc.line,
                column: endLoc.column,
            },
        },
        parent: null as never,
    }
    setParent(body, nn)
    return nn
}

/** Clone locations */
function cloneLocation(node: Locations): Locations {
    const range = node.range
    const loc = node.loc

    return {
        range: [range[0], range[1]],
        loc: {
            start: {
                line: loc.start.line,
                column: loc.start.column,
            },
            end: {
                line: loc.end.line,
                column: loc.end.column,
            },
        },
    }
}

/** Set parent node */
function setParent(prop: JSONNode, parent: JSONNode) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
    ;(prop as any).parent = parent
}
