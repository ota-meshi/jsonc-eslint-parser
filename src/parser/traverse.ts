import type { VisitorKeys } from "eslint-visitor-keys"
import type { JSONNode } from "./ast"
import { KEYS } from "./visitor-keys"

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * Check that the given key should be traversed or not.
 * @this {Traversable}
 * @param key The key to check.
 * @returns `true` if the key should be traversed.
 */
function fallbackKeysFilter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- any
    this: any,
    key: string,
): boolean {
    let value = null
    return (
        key !== "comments" &&
        key !== "leadingComments" &&
        key !== "loc" &&
        key !== "parent" &&
        key !== "range" &&
        key !== "tokens" &&
        key !== "trailingComments" &&
        (value = this[key]) !== null &&
        typeof value === "object" &&
        (typeof value.type === "string" || Array.isArray(value))
    )
}

/**
 * Get the keys of the given node to traverse it.
 * @param node The node to get.
 * @returns The keys to traverse.
 */
export function getFallbackKeys(node: JSONNode): string[] {
    return Object.keys(node).filter(fallbackKeysFilter, node)
}

/**
 * Get the keys of the given node to traverse it.
 * @param node The node to get.
 * @returns The keys to traverse.
 */
export function getKeys(node: JSONNode, visitorKeys?: VisitorKeys): string[] {
    const keys: readonly string[] =
        (visitorKeys || KEYS)[node.type] || getFallbackKeys(node)

    return keys.filter((key) => !getNodes(node, key).next().done)
}

/**
 * Get the nodes of the given node.
 * @param node The node to get.
 */
export function* getNodes(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- any
    node: any,
    key: string,
): IterableIterator<JSONNode> {
    const child = node[key]
    if (Array.isArray(child)) {
        for (const c of child) {
            if (isNode(c)) {
                yield c
            }
        }
    } else if (isNode(child)) {
        yield child
    }
}

/**
 * Check whether a given value is a node.
 * @param x The value to check.
 * @returns `true` if the value is a node.
 */
function isNode(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- any
    x: any,
): x is JSONNode {
    return x !== null && typeof x === "object" && typeof x.type === "string"
}

/**
 * Traverse the given node.
 * @param node The node to traverse.
 * @param parent The parent node.
 * @param visitor The node visitor.
 */
function traverse(
    node: JSONNode,
    parent: JSONNode | null,
    visitor: Visitor<JSONNode>,
): void {
    visitor.enterNode(node, parent)

    const keys = getKeys(node, visitor.visitorKeys)
    for (const key of keys) {
        for (const child of getNodes(node, key)) {
            traverse(child, node, visitor)
        }
    }

    visitor.leaveNode(node, parent)
}

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

export interface Visitor<N> {
    visitorKeys?: VisitorKeys
    enterNode(node: N, parent: N | null): void
    leaveNode(node: N, parent: N | null): void
}

export function traverseNodes(node: JSONNode, visitor: Visitor<JSONNode>): void
/**
 * Traverse the given AST tree.
 * @param node Root node to traverse.
 * @param visitor Visitor.
 */
export function traverseNodes(
    node: JSONNode,
    visitor: Visitor<JSONNode>,
): void {
    traverse(node, null, visitor)
}
