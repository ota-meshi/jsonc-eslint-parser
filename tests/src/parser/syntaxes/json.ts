import assert from "assert"

import { parseForESLint } from "../../../../src/parser/parser"
import type { ParseError } from "../../../../src/parser/errors"

function getParseError(code: string): ParseError {
    try {
        parseForESLint(code, {
            comment: true,
            ecmaVersion: 2020,
            eslintScopeManager: true,
            eslintVisitorKeys: true,
            filePath: "test.json",
            loc: true,
            range: true,
            raw: true,
            tokens: true,
            jsonSyntax: "json",
        })
    } catch (e) {
        return e
    }
    return assert.fail("Expected parsing error, but nor error")
}

describe("Check that parsing error is correct for JSON.", () => {
    for (const { code, message, lineNumber, column, index, char } of [
        {
            code: "[1,]",
            message: "Unexpected token ','.",
            lineNumber: 1,
            column: 3,
            index: 2,
            char: ",",
        },
        {
            code: '{"foo": "bar",}',
            message: "Unexpected token ','.",
            lineNumber: 1,
            column: 14,
            index: 13,
            char: ",",
        },
        {
            code: '{"foo": "bar"/**/}',
            message: "Unexpected comment.",
            lineNumber: 1,
            column: 14,
            index: 13,
            char: "/",
        },
    ]) {
        it(`JSON parseForESLint error on ${JSON.stringify(code)}`, () => {
            const e = getParseError(code)
            assert.deepStrictEqual(
                {
                    message: e.message,
                    lineNumber: e.lineNumber,
                    column: e.column,
                    index: e.index,
                    char: code[e.index],
                },
                { message, lineNumber, column, index, char },
            )
        })
    }
})
