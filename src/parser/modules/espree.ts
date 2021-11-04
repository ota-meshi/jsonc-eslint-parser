import { loadNewest, requireFromCwd, requireFromLinter } from "./require-utils"
import { lte } from "semver"

/**
 * The interface of ESLint custom parsers.
 */
export interface ESPree {
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
        espreeCache = loadNewest([
            {
                getPkg() {
                    return requireFromCwd("espree/package.json")
                },
                get() {
                    return requireFromCwd("espree")
                },
            },
            {
                getPkg() {
                    return requireFromLinter("espree/package.json")
                },
                get() {
                    return requireFromLinter("espree")
                },
            },
            {
                getPkg() {
                    // eslint-disable-next-line @typescript-eslint/no-require-imports -- special require
                    return require("espree/package.json")
                },
                get() {
                    // eslint-disable-next-line @typescript-eslint/no-require-imports -- special require
                    return require("espree")
                },
            },
        ])
    }
    return espreeCache!
}

type NewestKind = "cwd" | "linter" | "self"

let kindCache: NewestKind | null = null

/**
 * Get the newest `espree` kind from the loaded ESLint or dependency.
 */
export function getNewestEspreeKind(): NewestKind {
    if (kindCache) {
        return kindCache
    }
    const cwdPkg: { version: string } | null = requireFromCwd(
        "espree/package.json",
    )
    const linterPkg: { version: string } | null = requireFromLinter(
        "espree/package.json",
    )
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports -- ignore
    const self: { version: string } = require("espree/package.json")

    let target: { kind: NewestKind; version: string } = {
        kind: "self",
        version: self.version,
    }
    if (cwdPkg != null && lte(target.version, cwdPkg.version)) {
        target = { kind: "cwd", version: cwdPkg.version }
    }
    if (linterPkg != null && lte(target.version, linterPkg.version)) {
        target = { kind: "linter", version: linterPkg.version }
    }
    return (kindCache = target.kind)
}
