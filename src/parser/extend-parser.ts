import type { TokenStore } from "./token-store"
import type { JSONSyntaxContext } from "./validate"
import { validateNode } from "./validate"
import type { Parser, Options } from "acorn"
import type { Comment } from "../types"
import type { Node } from "estree"
import { getAcorn } from "./modules/acorn"
import { ParseError, throwUnexpectedCommentError } from "./errors"
import { TokenConvertor } from "./convert"

let parserCache: typeof Parser | undefined

const PRIVATE = Symbol("ExtendParser#private")
const PRIVATE_PROCESS_NODE = Symbol("ExtendParser#processNode")

/** Get extend parser */
export function getParser(): typeof Parser {
    if (parserCache) {
        return parserCache
    }

    parserCache = class ExtendParser extends getAcorn().Parser {
        private [PRIVATE]: {
            code: string
            ctx: JSONSyntaxContext
            tokenStore: TokenStore
            comments: Comment[]
            nodes: Node[]
        }

        public constructor(
            options: Options & {
                ctx: JSONSyntaxContext
                tokenStore: TokenStore
                comments: Comment[]
                nodes: Node[]
            },
            code: string,
        ) {
            super(
                ((): Options => {
                    const tokenConvertor = new TokenConvertor(code)
                    return {
                        // do not use spread, because we don't want to pass any unknown options to acorn
                        ecmaVersion: options.ecmaVersion,
                        sourceType: options.sourceType,
                        ranges: true,
                        locations: true,
                        allowReserved: true,

                        // Collect tokens
                        onToken: (token) => {
                            const t = tokenConvertor.convertToken(token)
                            if (t) {
                                this[PRIVATE].tokenStore.add(t)
                            }
                        },

                        // Collect comments
                        onComment: (
                            block,
                            text,
                            start,
                            end,
                            startLoc,
                            endLoc,
                        ) => {
                            const comment: Comment = {
                                type: block ? "Block" : "Line",
                                value: text,
                                range: [start, end],
                                loc: {
                                    start: startLoc!,
                                    end: endLoc!,
                                },
                            }
                            if (!this[PRIVATE].ctx.comments) {
                                throw throwUnexpectedCommentError(comment)
                            }
                            this[PRIVATE].comments.push(comment)
                        },
                    }
                })(),
                code,
            )
            this[PRIVATE] = {
                code,
                ctx: options.ctx,
                tokenStore: options.tokenStore,
                comments: options.comments,
                nodes: options.nodes,
            }
        }

        protected finishNode(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
            ...args: any[]
        ) {
            // @ts-expect-error -- ignore
            const result: Node = super.finishNode(...args)
            return this[PRIVATE_PROCESS_NODE](result)
        }

        protected finishNodeAt(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
            ...args: any[]
        ) {
            // @ts-expect-error -- ignore
            const result: Node = super.finishNodeAt(...args)
            return this[PRIVATE_PROCESS_NODE](result)
        }

        private [PRIVATE_PROCESS_NODE](node: Node) {
            const { tokenStore, ctx, nodes } = this[PRIVATE]
            validateNode(node, tokenStore, ctx)
            nodes.push(node)
            return node
        }

        protected raise(pos: number, message: string) {
            const loc = getAcorn().getLineInfo(this[PRIVATE].code, pos)
            const err = new ParseError(
                message,
                pos,
                loc.line,
                loc.column + 1, // acorn uses 0-based columns
            )
            throw err
        }

        protected raiseRecoverable(pos: number, message: string) {
            this.raise(pos, message)
        }

        protected unexpected(pos?: number) {
            if (pos != null) {
                this.raise(pos, "Unexpected token.")
                return
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
            const start: number = (this as any).start
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
            const end: number = (this as any).end

            const token = this[PRIVATE].code.slice(start, end)
            if (token) {
                const message = `Unexpected token '${token}'.`

                this.raise(start, message)
            } else {
                if (!this[PRIVATE].nodes.length) {
                    this.raise(
                        0,
                        "Expected to be an expression, but got empty.",
                    )
                }
                if (this[PRIVATE].tokenStore.tokens.length) {
                    const last =
                        this[PRIVATE].tokenStore.tokens[
                            this[PRIVATE].tokenStore.tokens.length - 1
                        ]
                    this.raise(
                        last.range[0],
                        `Unexpected token '${last.value}'.`,
                    )
                }
                this.raise(start, "Unexpected token.")
            }
        }
    }

    return parserCache
}
