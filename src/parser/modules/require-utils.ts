import path from "node:path";
import { lte } from "semver";
import { createRequire } from "node:module";

/**
 * Get NodeJS.Require from Linter
 */
export function getRequireFromLinter(): NodeJS.Require | null {
  try {
    const eslintPkgPath = getRequireFromCwd()?.resolve("eslint/package.json");
    if (!eslintPkgPath) return null;
    const relativeTo = path.join(
      path.dirname(eslintPkgPath),
      "__placeholder__.js",
    );
    return createRequire(relativeTo);
  } catch {
    // ignore
  }
  return null;
}

/**
 * Get NodeJS.Require from Cwd
 */
export function getRequireFromCwd(): NodeJS.Require | null {
  try {
    const cwd = process.cwd();
    const relativeTo = path.join(cwd, "__placeholder__.js");
    return createRequire(relativeTo);
  } catch {
    // ignore
  }
  return null;
}

/**
 * Get module from Linter
 */
export function requireFromLinter<T>(module: string): T | null {
  try {
    return getRequireFromLinter()?.(module);
  } catch {
    // ignore
  }
  return null;
}

/**
 * Get module path from Linter
 */
export function resolveFromLinter(module: string): string | null {
  try {
    return getRequireFromLinter()?.resolve(module) ?? null;
  } catch {
    // ignore
  }
  return null;
}

/**
 * Get module from Cwd
 */
export function requireFromCwd<T>(module: string): T | null {
  try {
    return getRequireFromCwd()?.(module);
  } catch {
    // ignore
  }
  return null;
}
/**
 * Get module path from Cwd
 */
export function resolveFromCwd(module: string): string | null {
  try {
    return getRequireFromCwd()?.resolve(module) ?? null;
  } catch {
    // ignore
  }
  return null;
}

/**
 * Get the newest `espree` kind from the loaded ESLint or dependency.
 */
export function loadNewest<T>(
  items: { getPkg: () => { version: string } | null; get: () => T | null }[],
): T {
  let target: { version: string; get: () => T | null } | null = null;
  for (const item of items) {
    const pkg = item.getPkg();
    if (pkg != null && (!target || lte(target.version, pkg.version))) {
      target = { version: pkg.version, get: item.get };
    }
  }
  return target!.get()!;
}
