import type { AST } from "eslint"
import path from "path"

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
 * Checks if the given string is a linter path.
 */
function isLinterPath(p: string) {
    return (
        p.includes(
            `eslint${path.sep}lib${path.sep}linter${path.sep}linter.js`,
        ) || p.includes(`eslint${path.sep}lib${path.sep}linter.js`)
    )
}

/**
 * Load `espree` from the loaded ESLint.
 * If the loaded ESLint was not found, just returns `require("espree")`.
 */
export function getEspree(): ESPree {
    if (!espreeCache) {
        const linterPath = Object.keys(require.cache).find(isLinterPath)
        if (linterPath) {
            try {
                espreeCache = createRequire(linterPath)("espree")
            } catch (_a) {
                // ignore
            }
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- special require
    return espreeCache || (espreeCache = require("espree"))
}

/**
 * createRequire
 */
function createRequire(filename: string) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports, @typescript-eslint/naming-convention -- special require
    const Module = require("module")
    const fn: (
        fileName: string,
    ) => // eslint-disable-next-line @typescript-eslint/no-explicit-any -- any
    any =
        // Added in v12.2.0
        Module.createRequire ||
        // Added in v10.12.0, but deprecated in v12.2.0.
        Module.createRequireFromPath ||
        // Polyfill - This is not executed on the tests on node@>=10.
        /* istanbul ignore next */
        ((filename2: string) => {
            const mod = new Module(filename2)

            mod.filename = filename2
            mod.paths = Module._nodeModulePaths(path.dirname(filename2))
            mod._compile("module.exports = require;", filename2)
            return mod.exports
        })
    return fn(filename)
}
