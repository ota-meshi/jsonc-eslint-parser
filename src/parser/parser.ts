import type { Comment, Node } from "estree";
import type { AST, SourceCode } from "eslint";
import { getVisitorKeys } from "./visitor-keys.ts";
import { convertProgramNode } from "./convert.ts";
import { TokenStore } from "./token-store.ts";
import type { JSONProgram } from "./ast.ts";
import { getAnyTokenErrorParser, getParser } from "./extend-parser.ts";
import {
  getJSONSyntaxContext,
  type JSONSyntaxContext,
} from "./syntax-context.ts";
import type { ParserOptions } from "./parser-options.ts";
import type { Options as AcornOptions } from "acorn";

/**
 * Parse JSON source code
 */
export function parseJSON(code: string, options?: ParserOptions): JSONProgram {
  const parserOptions: AcornOptions & {
    ctx?: JSONSyntaxContext;
    tokenStore?: TokenStore;
    comments?: Comment[];
    nodes?: Node[];
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
  const nodes: Node[] = [];
  parserOptions.ctx = ctx;
  parserOptions.tokenStore = tokenStore;
  parserOptions.comments = comments;
  parserOptions.nodes = nodes;
  const baseAst = getParser().parseExpressionAt(code, 0, parserOptions);
  // transform json nodes
  for (const node of nodes) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
    (node as any).type = `JSON${node.type}`;
  }
  const ast = convertProgramNode(baseAst as never, tokenStore, ctx, code);
  let lastIndex = Math.max(
    baseAst.range![1],
    tokens[tokens.length - 1]?.range[1] ?? 0,
    comments[comments.length - 1]?.range![1] ?? 0,
  );
  let lastChar = code[lastIndex];
  while (
    lastChar === "\n" ||
    lastChar === "\r" ||
    lastChar === " " ||
    lastChar === "\t"
  ) {
    lastIndex++;
    lastChar = code[lastIndex];
  }
  if (lastIndex < code.length) {
    getAnyTokenErrorParser().parseExpressionAt(code, lastIndex, parserOptions);
  }
  ast.tokens = tokens;
  ast.comments = comments;
  return ast;
}

/**
 * Parse source code
 */
export function parseForESLint(
  code: string,
  options?: ParserOptions,
): {
  ast: JSONProgram;
  visitorKeys: SourceCode.VisitorKeys;
  services: {
    isJSON: boolean;
  };
} {
  const ast = parseJSON(code, options);
  return {
    ast,
    visitorKeys: getVisitorKeys(),
    services: {
      isJSON: true,
    },
  };
}
