/* eslint @typescript-eslint/no-require-imports:0, @typescript-eslint/no-var-requires:0 -- for test */
/* globals process, require -- for test */
import assert from "assert"
import path from "path"
import fs from "fs"
import semver from "semver"

import { getStaticJSONValue, parseJSON } from "../../../src/index"
import { nodeReplacer } from "./utils"

const FIXTURE_ROOT = path.resolve(__dirname, "../../fixtures/parser/ast")

function parse(code: string, fileName: string) {
    const ext = path.extname(fileName)
    return parseJSON(code, {
        ecmaVersion: 2021,
        jsonSyntax:
            ext === ".json"
                ? "JSON"
                : ext === ".jsonc"
                ? "JSONC"
                : ext === ".json5"
                ? "JSON5"
                : undefined,
    })
}

describe("Check for AST.", () => {
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
        const inputFileName = path.join(FIXTURE_ROOT, filename)
        const outputFileName = inputFileName.replace(
            /input\.json[56cx]?$/u,
            "output.json",
        )

        const requirementsPath = inputFileName.replace(
            /input\.json[56cx]?$/u,
            "requirements.json",
        )
        const requirements = fs.existsSync(requirementsPath)
            ? JSON.parse(fs.readFileSync(requirementsPath, "utf8"))
            : {}
        if (
            Object.entries(requirements).some(([pkgName, pkgVersion]) => {
                const version =
                    pkgName === "node"
                        ? process.version
                        : require(`${pkgName}/package.json`).version
                return !semver.satisfies(version, pkgVersion as string)
            })
        ) {
            continue
        }
        it(`AST:${filename}`, () => {
            const input = fs.readFileSync(inputFileName, "utf8")
            const ast = parse(input, inputFileName)
            const astJson = JSON.stringify(ast, nodeReplacer, 2)
            const output = fs.readFileSync(outputFileName, "utf8")
            assert.strictEqual(astJson, output)

            assert.strictEqual(ast.range[1] - ast.range[0], input.length)
        })
        it(`Static Value:${filename}`, () => {
            const input = fs.readFileSync(inputFileName, "utf8")
            const ast = parse(input, inputFileName)
            const value = getStaticJSONValue(ast)

            assert.deepStrictEqual(
                value,
                new Function(`return (${input.trim()}\n)`)(),
            )
        })
    }
})
