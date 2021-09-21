/**
 * Remove `parent` properties from the given AST.
 */
export function nodeReplacer(key: string, value: any): any {
    if (key === "parent") {
        return undefined
    }
    if (value instanceof RegExp) {
        return String(value)
    }
    if (typeof value === "bigint") {
        return null // Make it null so it can be checked on node8.
        // return `${String(value)}n`
    }
    return normalizeObject(value)
}

const nodeToKeys: Record<string, string[]> = {
    Program: ["body", "sourceType", "comments", "tokens"],
    JSONProperty: ["key", "value", "kind", "computed", "method", "shorthand"],
    JSONLiteral: ["value", "raw"],
    JSONUnaryExpression: ["operator", "prefix", "argument"],
    JSONTemplateLiteral: ["quasis", "expressions"],
}

function normalizeObject(value: any) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return value
    }
    const isNode =
        typeof value.type === "string" &&
        (typeof value.start === "number" ||
            typeof value.range?.[0] === "number")
    if (!isNode) {
        return value
    }

    function firsts(k: string, nodeType: string | null) {
        const o = [
            "type",
            ...((nodeType != null && nodeToKeys[nodeType]) || []),
            // scope
            "identifier",
            "from",
            "variables",
            "identifiers",
            "defs",
            "references",
            "childScopes",
        ].indexOf(k)

        return o === -1 ? Infinity : o
    }

    function lasts(k: string, _nodeType: string | null) {
        return [
            // locs
            "start",
            "end",
            "line",
            "column",
            //
            "range",
            "loc",
        ].indexOf(k)
    }

    let entries = Object.entries(value)
    if (isNode) {
        entries = entries.filter(
            ([k]) => k !== "parent" && k !== "start" && k !== "end",
        )
    }
    const nodeType: string | null = isNode ? value.type : null

    return Object.fromEntries(
        entries.sort(([a], [b]) => {
            const c =
                firsts(a, nodeType) - firsts(b, nodeType) ||
                lasts(a, nodeType) - lasts(b, nodeType)
            if (c) {
                return c
            }
            return a < b ? -1 : a > b ? 1 : 0
        }),
    )
}
