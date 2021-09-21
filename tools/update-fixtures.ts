import path from "path"
import fs from "fs"

import { parseForESLint } from "../src/parser/parser"
import { nodeReplacer } from "../tests/src/parser/utils"

const FIXTURE_ROOT = path.resolve(__dirname, "../tests/fixtures/parser/ast")

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
    })
}

for (const filename of fs
    .readdirSync(FIXTURE_ROOT)
    .filter(
        (f) =>
            f.endsWith("input.json5") ||
            f.endsWith("input.json6") ||
            f.endsWith("input.jsonx"),
    )) {
    const inputFileName = path.join(FIXTURE_ROOT, filename)
    const outputFileName = inputFileName.replace(
        /input\.json[56x]$/u,
        "output.json",
    )

    const input = fs.readFileSync(inputFileName, "utf8")
    try {
        const ast = JSON.stringify(parse(input).ast, nodeReplacer, 2)
        fs.writeFileSync(outputFileName, ast, "utf8")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
    } catch (e: any) {
        fs.writeFileSync(
            outputFileName,
            `${e.message}@line:${e.lineNumber},column:${e.column}`,
            "utf8",
        )
    }
}
