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
            jsonSyntax: "jsonc",
        })
    } catch (e) {
        return e
    }
    return assert.fail("Expected parsing error, but nor error")
}

describe("Check that parsing error is correct for JSONC.", () => {
    for (const { code, message, lineNumber, column, index, char } of [
        {
            code: "+1",
            message: "Unexpected token '+'.",
            lineNumber: 1,
            column: 1,
            index: 0,
            char: "+",
        },
        {
            code: "- 1",
            message: "Unexpected whitespace.",
            lineNumber: 1,
            column: 2,
            index: 1,
            char: " ",
        },
        {
            code: ".1",
            message: "Unexpected token '.'.",
            lineNumber: 1,
            column: 1,
            index: 0,
            char: ".",
        },
        {
            code: "1.",
            message: "Unexpected token '.'.",
            lineNumber: 1,
            column: 2,
            index: 1,
            char: ".",
        },
        {
            code: "NaN",
            message: "Unexpected identifier 'NaN'.",
            lineNumber: 1,
            column: 1,
            index: 0,
            char: "N",
        },
        {
            code: "Infinity",
            message: "Unexpected identifier 'Infinity'.",
            lineNumber: 1,
            column: 1,
            index: 0,
            char: "I",
        },
        {
            code: "0x123",
            message: "Invalid number 0x123.",
            lineNumber: 1,
            column: 1,
            index: 0,
            char: "0",
        },
        {
            code: '"Line 1 \\\nLine 2"',
            message: "Unexpected multiline string.",
            lineNumber: 1,
            column: 1,
            index: 0,
            char: '"',
        },
        {
            code: '{a: "b"}',
            message: "Unexpected identifier 'a'.",
            lineNumber: 1,
            column: 2,
            index: 1,
            char: "a",
        },
        {
            code: "{\"a\": 'b'}",
            message: "Unexpected single quoted.",
            lineNumber: 1,
            column: 7,
            index: 6,
            char: "'",
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
        it(`JSONC parseForESLint error on ${JSON.stringify(code)}`, () => {
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
