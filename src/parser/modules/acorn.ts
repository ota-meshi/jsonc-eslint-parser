import type * as acorn from "acorn"
import { createRequire } from "module"
import { getRequireFromCwd, getRequireFromLinter } from "../require-utils"

let acornCache: typeof acorn | undefined
/**
 * Load `acorn` from the loaded ESLint.
 * If the loaded ESLint was not found, just returns `require("acorn")`.
 */
export function getAcorn(): typeof acorn {
    if (!acornCache) {
        try {
            const nodeRequire = getRequireFromCwd() || getRequireFromLinter()
            if (nodeRequire) {
                acornCache = createRequire(nodeRequire.resolve("espree"))(
                    "acorn",
                )
            }
        } catch {
            // ignore
        }
        if (!acornCache) {
            // eslint-disable-next-line @typescript-eslint/no-require-imports -- ignore
            acornCache = require("acorn")
        }
    }
    return acornCache!
}
