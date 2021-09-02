import type { AST } from "eslint"
import { requireFromCwd, requireFromLinter } from "./require-utils"

/**
 * The interface of ESLint custom parsers.
 */
export interface ESPree {
    parse(
        code: string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- any
        options: any,
    ): AST.Program
    latestEcmaVersion?: number
    version: string
}

let espreeCache: ESPree | null = null

/**
 * Load `espree` from the loaded ESLint.
 * If the loaded ESLint was not found, just returns `require("espree")`.
 */
export function getEspree(): ESPree {
    if (!espreeCache) {
        espreeCache =
            requireFromCwd("espree") ||
            requireFromLinter("espree") ||
            // eslint-disable-next-line @typescript-eslint/no-require-imports -- special require
            require("espree")
    }
    return espreeCache!
}
