import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

import { parseForESLint } from "../src/parser/parser.js";
import { nodeReplacer } from "../tests/src/parser/utils.js";

// eslint-disable-next-line @typescript-eslint/naming-convention -- ESM __filename polyfill
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line @typescript-eslint/naming-convention -- ESM __dirname polyfill
const __dirname = path.dirname(__filename);

const FIXTURE_ROOT = path.resolve(__dirname, "../tests/fixtures/parser/ast");

/**
 * Parse
 */
function parse(code: string) {
  return parseForESLint(code, {
    comment: true,
    ecmaVersion: 2021,
    eslintScopeManager: true,
    eslintVisitorKeys: true,
    filePath: "test.json",
    loc: true,
    range: true,
    raw: true,
    tokens: true,
  });
}

for (const filename of fs
  .readdirSync(FIXTURE_ROOT)
  .filter(
    (f) =>
      f.endsWith("input.json5") ||
      f.endsWith("input.json6") ||
      f.endsWith("input.jsonx") ||
      f.endsWith("input.jsonc") ||
      f.endsWith("input.json"),
  )) {
  const inputFileName = path.join(FIXTURE_ROOT, filename);
  const outputFileName = inputFileName.replace(
    /input\.json[56cx]?$/u,
    "output.json",
  );

  const input = fs.readFileSync(inputFileName, "utf8");
  try {
    const ast = JSON.stringify(parse(input).ast, nodeReplacer, 2);
    fs.writeFileSync(outputFileName, ast, "utf8");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
  } catch (e: any) {
    fs.writeFileSync(
      outputFileName,
      `${e.message}@line:${e.lineNumber},column:${e.column}`,
      "utf8",
    );
  }
}
