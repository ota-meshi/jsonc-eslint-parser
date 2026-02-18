import type { Comment, Node } from "estree";
import type { TokenStore, MaybeNodeOrToken } from "./token-store.ts";
import type { JSONNode } from "./ast.ts";
import { isRegExpLiteral } from "./utils.ts";

/**
 * JSON parse errors.
 */
export class ParseError extends SyntaxError {
  public index: number;

  public lineNumber: number;

  public column: number;

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
    super(message);
    this.index = offset;
    this.lineNumber = line;
    this.column = column;
  }
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
  const locs = getLocation(beforeToken);
  const err = new ParseError(
    `Expected token '${name}'.`,
    locs.end,
    locs.loc.end.line,
    locs.loc.end.column + 1,
  );

  throw err;
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
  const locs = getLocation(token);
  const err = new ParseError(
    `Unexpected ${name}.`,
    locs.start,
    locs.loc.start.line,
    locs.loc.start.column + 1,
  );

  throw err;
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
  return throwUnexpectedError(`token '${name}'`, token);
}

/**
 * Throw syntax error for unexpected comment.
 * @param name The token name.
 * @param token The token object to get that location.
 */
export function throwUnexpectedCommentError(token: Comment): never {
  return throwUnexpectedError("comment", token);
}

/**
 * Throw syntax error for unexpected whitespace.
 */
export function throwUnexpectedSpaceError(
  beforeToken: MaybeNodeOrToken,
): never {
  const locs = getLocation(beforeToken);
  const err = new ParseError(
    "Unexpected whitespace.",
    locs.end,
    locs.loc.end.line,
    locs.loc.end.column + 1,
  );

  throw err;
}

/**
 * Throw syntax error for unexpected invalid number.
 */
export function throwInvalidNumberError(
  text: string,
  token: MaybeNodeOrToken,
): never {
  const locs = getLocation(token);
  const err = new ParseError(
    `Invalid number ${text}.`,
    locs.start,
    locs.loc.start.line,
    locs.loc.start.column + 1,
  );

  throw err;
}

/**
 * Throw syntax error for unexpected token.
 * @param node The token object to get that location.
 */
export function throwUnexpectedNodeError(
  node: Node | JSONNode,
  tokens: TokenStore,
  offset?: number,
): never {
  if (node.type === "Identifier" || node.type === "JSONIdentifier") {
    const locs = getLocation(node);
    const err = new ParseError(
      `Unexpected identifier '${node.name}'.`,
      locs.start,
      locs.loc.start.line,
      locs.loc.start.column + 1,
    );
    throw err;
  }
  if (node.type === "Literal" || node.type === "JSONLiteral") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- bigint
    const type = (node as any).bigint
      ? "bigint"
      : isRegExpLiteral(node)
        ? "regex"
        : node.value === null
          ? "null"
          : typeof node.value;
    const locs = getLocation(node);
    const err = new ParseError(
      `Unexpected ${type} literal.`,
      locs.start,
      locs.loc.start.line,
      locs.loc.start.column + 1,
    );
    throw err;
  }
  if (node.type === "TemplateLiteral" || node.type === "JSONTemplateLiteral") {
    const locs = getLocation(node);
    const err = new ParseError(
      "Unexpected template literal.",
      locs.start,
      locs.loc.start.line,
      locs.loc.start.column + 1,
    );
    throw err;
  }
  if (node.type.endsWith("Expression") && node.type !== "FunctionExpression") {
    const name = node.type
      .replace(/^JSON/u, "")
      .replace(/\B([A-Z])/gu, " $1")
      .toLowerCase();
    const locs = getLocation(node);
    const err = new ParseError(
      `Unexpected ${name}.`,
      locs.start,
      locs.loc.start.line,
      locs.loc.start.column + 1,
    );
    throw err;
  }
  const index = node.range![0] + (offset || 0);
  const t = tokens.findTokenByOffset(index);
  const name = t?.value || "unknown";
  const locs = getLocation(t || node);
  const err = new ParseError(
    `Unexpected token '${name}'.`,
    locs.start,
    locs.loc.start.line,
    locs.loc.start.column + 1,
  );

  throw err;
}

/** get locations */
function getLocation(
  token: MaybeNodeOrToken & { start?: number; end?: number },
) {
  const start = token.range?.[0] ?? token.start!;
  const end = token.range?.[1] ?? token.end!;
  const loc = token.loc!;
  return { start, end, loc };
}
