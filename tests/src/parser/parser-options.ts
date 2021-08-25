import assert from "assert"

import { parseForESLint } from "../../../src/parser/parser"
import { Linter } from "eslint"

describe("Parser options.", () => {
    for (const { code, parserOptions, errors } of [
        {
            code: "1_2_3",
            parserOptions: {
                ecmaVersion: "latest",
            },
            errors: [],
        },
        {
            code: "1_2_3",
            parserOptions: {
                ecmaVersion: 2099,
            },
            errors: [],
        },
    ]) {
        it(`${JSON.stringify(code)} with parserOptions: ${JSON.stringify(
            parserOptions,
        )}`, () => {
            const linter = new Linter()
            linter.defineParser("jsonc-eslint-parser", {
                parseForESLint: parseForESLint as never,
            })

            const result = linter.verify(
                code,
                {
                    parser: "jsonc-eslint-parser",
                    parserOptions: parserOptions as never,
                },
                "test.json",
            )
            assert.deepStrictEqual(result, errors)
        })
    }
})
