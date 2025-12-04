import type { Comment, Node } from "estree";
import type { AST, SourceCode } from "eslint";
import type { ESPree } from "./modules/espree";
import { getEspree } from "./modules/espree";
import { getVisitorKeys } from "./visitor-keys";
import { convertProgramNode } from "./convert";
import { TokenStore } from "./token-store";
import type { JSONProgram } from "./ast";
import { lte } from "semver";
import { getAnyTokenErrorParser, getParser } from "./extend-parser";
import type { JSONSyntaxContext } from "./syntax-context";
import type * as ParserAST from "./ast";

const DEFAULT_ECMA_VERSION = "latest";

/**
 * Parse JSON source code
 */
export function parseJSON(
  code: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- any
  options?: any,
): ParserAST.JSONProgram {
  return parseForESLint(code, options).ast as never;
}

/**
 * Parse source code
 */
export function parseForESLint(
  code: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- any
  options?: any,
): {
  ast: JSONProgram;
  visitorKeys: SourceCode.VisitorKeys;
  services: {
    isJSON: boolean;
  };
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
  );
  parserOptions.ecmaVersion = normalizeEcmaVersion(parserOptions.ecmaVersion);
  const ctx: JSONSyntaxContext = getJSONSyntaxContext(parserOptions.jsonSyntax);
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
  return {
    ast,
    visitorKeys: getVisitorKeys(),
    services: {
      isJSON: true,
    },
  };
}

/**
 * Normalize json syntax option
 */
function getJSONSyntaxContext(str?: string | null): JSONSyntaxContext {
  const upperCase = str?.toUpperCase();
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
      parentheses: false,
      staticExpressions: false,
    };
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
      parentheses: false,
      staticExpressions: false,
    };
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
      parentheses: false,
      staticExpressions: false,
    };
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
    parentheses: true,
    staticExpressions: true,
  };
}

/**
 * Normalize ECMAScript version
 */
function normalizeEcmaVersion(version: number | "latest" | undefined) {
  const espree = getEspree();
  const latestEcmaVersion = getLatestEcmaVersion(espree);
  if (version == null || version === "latest") {
    return latestEcmaVersion;
  }
  return Math.min(getEcmaVersionYear(version), latestEcmaVersion);
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
        return latest;
      }
    }
    return 2018;
  }
  return getEcmaVersionYear(espree.latestEcmaVersion);
}

/**
 * Get ECMAScript version year
 */
function getEcmaVersionYear(version: number) {
  return version > 5 && version < 2015 ? version + 2009 : version;
}
