import type { Literal, RegExpLiteral } from "estree";
import type { JSONLiteral, JSONRegExpLiteral } from "./ast.ts";

export function isRegExpLiteral(node: JSONLiteral): node is JSONRegExpLiteral;
export function isRegExpLiteral(node: Literal): node is RegExpLiteral;
export function isRegExpLiteral(
  node: JSONLiteral | Literal,
): node is JSONRegExpLiteral | RegExpLiteral;
/**
 * Check if the given node is RegExpLiteral
 */
export function isRegExpLiteral(
  node: JSONLiteral | Literal,
): node is JSONRegExpLiteral | RegExpLiteral {
  return (
    Boolean((node as JSONRegExpLiteral | RegExpLiteral).regex) ||
    node.raw!.startsWith("/")
  );
}
