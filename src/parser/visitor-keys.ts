import type { SourceCode } from "eslint"
import type * as Evk from "eslint-visitor-keys"
import type { JSONNode } from "./ast"
import {
    loadNewest,
    requireFromCwd,
    requireFromLinter,
} from "./modules/require-utils"

const jsonKeys: { [key in JSONNode["type"]]: string[] } = {
    Program: ["body"],
    JSONExpressionStatement: ["expression"],
    JSONArrayExpression: ["elements"],
    JSONObjectExpression: ["properties"],
    JSONProperty: ["key", "value"],
    JSONIdentifier: [],
    JSONLiteral: [],
    JSONUnaryExpression: ["argument"],
    JSONTemplateLiteral: ["quasis", "expressions"],
    JSONTemplateElement: [],
}

let cache: SourceCode.VisitorKeys | null = null
/**
 * Get visitor keys
 */
export function getVisitorKeys(): SourceCode.VisitorKeys {
    if (!cache) {
        const vk: typeof Evk = loadNewest([
            {
                getPkg() {
                    return requireFromCwd("eslint-visitor-keys/package.json")
                },
                get() {
                    return requireFromCwd("eslint-visitor-keys")
                },
            },
            {
                getPkg() {
                    return requireFromLinter("eslint-visitor-keys/package.json")
                },
                get() {
                    return requireFromLinter("eslint-visitor-keys")
                },
            },
            {
                getPkg() {
                    // eslint-disable-next-line @typescript-eslint/no-require-imports -- special require
                    return require("eslint-visitor-keys/package.json")
                },
                get() {
                    // eslint-disable-next-line @typescript-eslint/no-require-imports -- special require
                    return require("eslint-visitor-keys")
                },
            },
        ])

        cache = vk.unionWith(jsonKeys) as SourceCode.VisitorKeys
    }
    return cache
}
