import type { AST } from "eslint";
import type { Tokenizer } from "./extend-parser.ts";
import { getParser } from "./extend-parser.ts";
import type { Comment } from "estree";
import { TokenStore } from "./token-store.ts";
import type { JSONSyntaxContext } from "./syntax-context.ts";
import { getJSONSyntaxContext } from "./syntax-context.ts";
import type { Options as AcornOptions } from "acorn";
import type { ParserOptions } from "./parser-options.ts";

/**
 * Tokenizes the given code.
 * @param code The code to tokenize.
 * @param options The options to use for tokenization.
 * @private
 */
export function tokenize(
  code: string,
  options?: ParserOptions & {
    includeComments?: false | null | undefined;
  },
): AST.Token[];
/**
 * Tokenizes the given code.
 * @param code The code to tokenize.
 * @param options The options to use for tokenization.
 * @private
 */
export function tokenize(
  code: string,
  options: ParserOptions & {
    includeComments: true;
  },
): (AST.Token | Comment)[];
/**
 * Tokenizes the given code.
 * @param code The code to tokenize.
 * @param options The options to use for tokenization.
 * @private
 */
export function tokenize(
  code: string,
  options?: ParserOptions & {
    includeComments?: boolean | null;
  },
): (AST.Token | Comment)[] {
  const parserOptions: AcornOptions & {
    ctx?: JSONSyntaxContext;
    tokenStore?: TokenStore;
    comments?: Comment[];
  } = Object.assign({ filePath: "<input>" }, options || {}, {
    loc: true,
    range: true,
    raw: true,
    tokens: true,
    comment: true,
    ecmaVersion: "latest" as const,
  });
  const ctx: JSONSyntaxContext = getJSONSyntaxContext(options?.jsonSyntax);
  const tokens: AST.Token[] = [];
  const comments: Comment[] = [];
  const tokenStore = new TokenStore(tokens);
  parserOptions.ctx = ctx;
  parserOptions.tokenStore = tokenStore;
  parserOptions.comments = comments;

  const parser = getParser();

  const tokenizer = parser.tokenizer(code, parserOptions) as never as Tokenizer;
  tokenizer.tokenize();

  if (!options?.includeComments) {
    return tokens;
  }
  const result: (AST.Token | Comment)[] = [];
  let commentIndex = 0;

  for (const token of tokens) {
    // Add comments that come before this token
    while (
      commentIndex < comments.length &&
      comments[commentIndex].range![0] < token.range[0]
    ) {
      result.push(comments[commentIndex]);
      commentIndex++;
    }
    result.push(token);
  }

  // Add remaining comments
  while (commentIndex < comments.length) {
    result.push(comments[commentIndex]);
    commentIndex++;
  }

  return result;
}
