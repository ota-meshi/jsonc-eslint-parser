import assert from "assert"

import { parseForESLint } from "../../../../src/parser/parser"
import type { ParseError } from "../../../../src/parser/errors"

function getParseError(code: string): ParseError {
    try {
        parseForESLint(code, {
            comment: true,
            ecmaVersion: 2021,
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
        {
            code: '{"foo": 1_2_3}',
            message: "Unexpected token '_'.",
            lineNumber: 1,
            column: 10,
            index: 9,
            char: "_",
        },
        {
            code: '{"\\u{31}":"foo"}',
            message: "Unexpected unicode codepoint escape.",
            lineNumber: 1,
            column: 2,
            index: 1,
            char: '"',
        },
        {
            code: '{"foo": "\\u{31}"}',
            message: "Unexpected unicode codepoint escape.",
            lineNumber: 1,
            column: 9,
            index: 8,
            char: '"',
        },
        {
            code: '{a\\u{31}:"foo"}',
            message: "Unexpected identifier 'a1'.",
            lineNumber: 1,
            column: 2,
            index: 1,
            char: "a",
        },
        {
            code: "0b1",
            message: "Unexpected binary numeric literal.",
            lineNumber: 1,
            column: 1,
            index: 0,
            char: "0",
        },
        {
            code: "0o1",
            message: "Unexpected octal numeric literal.",
            lineNumber: 1,
            column: 1,
            index: 0,
            char: "0",
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
