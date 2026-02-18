import path from "node:path";
import { lte } from "semver";
import type ModuleClass from "node:module";

/**
 * createRequire
 */
export function createRequire(
  filename: string,
): ReturnType<typeof ModuleClass.createRequire> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports, @typescript-eslint/naming-convention -- special require
  const Module = require("node:module");
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
      const mod = new Module(filename2);

      mod.filename = filename2;
      mod.paths = Module._nodeModulePaths(path.dirname(filename2));
      mod._compile("module.exports = require;", filename2);
      return mod.exports;
    });
  return fn(filename);
}

/**
 * Checks if the given string is a linter path.
 */
function isLinterPath(p: string) {
  return (
    p.includes(`eslint${path.sep}lib${path.sep}linter${path.sep}linter.js`) ||
    p.includes(`eslint${path.sep}lib${path.sep}linter.js`)
  );
}

/**
 * Get NodeRequire from Linter
 */
export function getRequireFromLinter(): NodeRequire | null {
  // Lookup the loaded eslint
  const linterPath = Object.keys(require.cache).find(isLinterPath);
  if (linterPath) {
    try {
      return createRequire(linterPath);
    } catch {
      // ignore
    }
  }
  return null;
}

/**
 * Get NodeRequire from Cwd
 */
export function getRequireFromCwd(): NodeRequire | null {
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
