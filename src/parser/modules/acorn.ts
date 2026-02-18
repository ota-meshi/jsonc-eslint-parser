import * as acorn from "acorn";
import acornPkg from "acorn/package.json" with { type: "json" };
import { createRequire } from "node:module";
import {
  getRequireFromCwd,
  getRequireFromLinter,
  loadNewest,
  requireFromCwd,
  requireFromLinter,
} from "./require-utils.ts";

let acornCache: typeof acorn | undefined;
/**
 * Load `acorn` from the loaded ESLint.
 * If the loaded ESLint was not found, just returns `require("acorn")`.
 */
export function getAcorn(): typeof acorn {
  if (!acornCache) {
    acornCache = loadNewest([
      {
        getPkg() {
          return requireFromCwd("acorn/package.json");
        },
        get() {
          return requireFromCwd("acorn");
        },
      },
      {
        getPkg() {
          return requireFromEspree("acorn/package.json");
        },
        get() {
          return requireFromEspree("acorn");
        },
      },
      {
        getPkg() {
          return acornPkg;
        },
        get() {
          return acorn;
        },
      },
    ]);
  }
  return acornCache!;
}

/**
 * Get module from espree
 */
function requireFromEspree<T>(module: string): T | null {
  // Lookup the loaded espree
  try {
    return createRequire(getEspreePath())(module);
  } catch {
    // ignore
  }
  return null;
}

/** Get espree path */
function getEspreePath(): string {
  return loadNewest([
    {
      getPkg() {
        return requireFromCwd("espree/package.json");
      },
      get() {
        return getRequireFromCwd()!.resolve("espree");
      },
    },
    {
      getPkg() {
        return requireFromLinter("espree/package.json");
      },
      get() {
        return getRequireFromLinter()!.resolve("espree");
      },
    },
    {
      getPkg() {
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- special require
        return require("espree/package.json");
      },
      get() {
        return require.resolve("espree");
      },
    },
  ]);
}
