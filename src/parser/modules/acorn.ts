import * as acorn from "acorn";
import acornPkg from "acorn/package.json" with { type: "json" };
import { createRequire } from "node:module";
import { loadNewest, requireFromCwd } from "./require-utils.ts";
import { getEspreePath } from "./espree.ts";
import path from "node:path";

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
    const espreePath = getEspreePath();
    if (!espreePath) {
      return null;
    }
    const relativeTo = path.join(espreePath, "__placeholder__.js");
    return createRequire(relativeTo)(module);
  } catch {
    // ignore
  }
  return null;
}
