import type { AST } from "eslint"
import type { Comment as ESTreeComment } from "estree"
export interface RuleListener {
    [key: string]: (node: never) => void
}

export type Token = AST.Token
export type Comment = ESTreeComment

export type JSONSyntax = "JSON" | "JSONC" | "JSON5" | null

export interface ParserOptions {
    jsonSyntax?: JSONSyntax
}
