import type { AST } from "eslint"
import type { SourceLocation } from "./ast"

export type MaybeNodeOrToken = {
    range?: [number, number]
    loc?: SourceLocation | null
}

// type TokenType = AST.TokenType | "Template"

export class TokenStore {
    private readonly tokens: AST.Token[]

    public constructor(tokens: AST.Token[]) {
        this.tokens = tokens
    }

    public findIndexByOffset(offset: number): number {
        return this.tokens.findIndex(
            (token) => token.range[0] <= offset && offset < token.range[1],
        )
    }

    public findTokenByOffset(offset: number): AST.Token | null {
        return this.tokens[this.findIndexByOffset(offset)]
    }

    /**
     * Get the first token representing the given node.
     *
     */
    public getFirstToken(nodeOrToken: MaybeNodeOrToken): AST.Token {
        return this.findTokenByOffset(nodeOrToken.range![0])!
    }

    /**
     * Get the last token representing the given node.
     *
     */
    public getLastToken(nodeOrToken: MaybeNodeOrToken): AST.Token {
        return this.findTokenByOffset(nodeOrToken.range![1] - 1)!
    }

    /**
     * Get the first token before the given node or token.
     */
    public getTokenBefore(
        nodeOrToken: MaybeNodeOrToken,
        filter?: (token: AST.Token) => boolean,
    ): AST.Token | null {
        const tokenIndex = this.findIndexByOffset(nodeOrToken.range![0])

        for (let index = tokenIndex - 1; index >= 0; index--) {
            const token = this.tokens[index]
            if (!filter || filter(token)) {
                return token
            }
        }
        return null
    }

    /**
     * Get the first token after the given node or token.
     */
    public getTokenAfter(
        nodeOrToken: MaybeNodeOrToken,
        filter?: (token: AST.Token) => boolean,
    ): AST.Token | null {
        const tokenIndex = this.findIndexByOffset(nodeOrToken.range![0])

        for (let index = tokenIndex + 1; index < this.tokens.length; index++) {
            const token = this.tokens[index]
            if (!filter || filter(token)) {
                return token
            }
        }
        return null
    }
}

/**
 * Checks if given token is comma
 */
export function isComma(
    token: AST.Token,
): token is AST.Token & { type: "Punctuator"; value: "," } {
    return token.type === "Punctuator" && token.value === ","
}
