import {
  loadNewest,
  requireFromCwd,
  requireFromLinter,
  resolveFromCwd,
  resolveFromLinter,
} from "./require-utils.ts";
import * as espree from "espree";
import espreePkg from "espree/package.json" with { type: "json" };
import path from "node:path";

/**
 * The interface of ESLint custom parsers.
 */
export interface ESPree {
  latestEcmaVersion?: number;
  version: string;
}
type NewestKind = "cwd" | "linter" | "self";
type ESPreeData = {
  module: ESPree;
  packageJsonPath: string;
  kind: NewestKind;
};

let espreeCache: ESPreeData | null = null;

/**
 * Load `espree` from the loaded ESLint.
 * If the loaded ESLint was not found, just returns `require("espree")`.
 */
export function getEspree(): ESPree {
  return getEspreeData().module;
}
/**
 * Get the path to the loaded `espree`'s package.json.
 * If the loaded ESLint was not found, just returns `require.resolve("espree/package.json")`.
 */
export function getEspreePath(): string {
  return path.dirname(getEspreeData().packageJsonPath);
}
/**
 * Get the newest `espree` kind from the loaded ESLint or dependency.
 */
export function getNewestEspreeKind(): NewestKind {
  return getEspreeData().kind;
}

/**
 *
 */
function getEspreeData(): ESPreeData {
  if (!espreeCache) {
    espreeCache = loadNewest<ESPreeData>([
      {
        getPkg() {
          return requireFromCwd("espree/package.json");
        },
        get() {
          const module = requireFromCwd<ESPree>("espree");
          if (!module) return null;
          return {
            module,
            packageJsonPath: resolveFromCwd("espree/package.json")!,
            kind: "cwd",
          };
        },
      },
      {
        getPkg() {
          return requireFromLinter("espree/package.json");
        },
        get() {
          const module = requireFromLinter<ESPree>("espree");
          if (!module) return null;
          return {
            module,
            packageJsonPath: resolveFromLinter("espree/package.json")!,
            kind: "linter",
          };
        },
      },
      {
        getPkg() {
          return espreePkg;
        },
        get() {
          let module: ESPree | typeof espree = espree;
          if (!("version" in module)) {
            module = {
              ...module,
              version: espreePkg.version,
            };
          }

          return {
            module: module as ESPree,
            packageJsonPath: import.meta.resolve("espree/package.json"),
            kind: "self",
          };
        },
      },
    ]);
  }
  return espreeCache;
}
