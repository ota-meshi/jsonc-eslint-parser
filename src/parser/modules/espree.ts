import {
  loadNewest,
  requireFromCwd,
  requireFromLinter,
  resolveFromCwd,
  resolveFromLinter,
} from "./require-utils.ts";
import path from "node:path";

type NewestKind = "cwd" | "linter" | "none";
type ESPreeData = {
  packageJsonPath: string;
  kind: NewestKind;
};

let espreeCache: ESPreeData | null = null;

/**
 * Get the path to the loaded `espree`'s package.json.
 * If the loaded ESLint was not found, just returns `require.resolve("espree/package.json")`.
 */
export function getEspreePath(): string | null {
  const data = getEspreeData();
  if (!data) {
    return null;
  }
  return path.dirname(data.packageJsonPath);
}
/**
 * Get the newest `espree` kind from the loaded ESLint or dependency.
 */
export function getNewestEspreeKind(): NewestKind {
  return getEspreeData()?.kind ?? "none";
}

/**
 *
 */
function getEspreeData(): ESPreeData | null {
  if (!espreeCache) {
    espreeCache = loadNewest<ESPreeData>([
      {
        getPkg() {
          return requireFromCwd("espree/package.json");
        },
        get() {
          const packageJsonPath = resolveFromCwd("espree/package.json");
          if (!packageJsonPath) return null;
          return {
            packageJsonPath,
            kind: "cwd",
          };
        },
      },
      {
        getPkg() {
          return requireFromLinter("espree/package.json");
        },
        get() {
          const packageJsonPath = resolveFromLinter("espree/package.json");
          if (!packageJsonPath) return null;
          return {
            packageJsonPath,
            kind: "linter",
          };
        },
      },
    ]);
  }
  return espreeCache;
}
