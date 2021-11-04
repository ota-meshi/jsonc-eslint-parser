import assert from "assert"

import { parseForESLint } from "../../../src/parser/parser"
import type { ParseError } from "../../../src/parser/errors"

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
        })
    } catch (e: any) {
        return e
    }
    return assert.fail("Expected parsing error, but nor error")
}

describe("Check that parsing error is correct.", () => {
    for (const { code, message, lineNumber, column, index, char } of [
        {
            code: `
{
  a: }
}`,

            message: "Unexpected token '}'.",
            lineNumber: 3,
            column: 6,
            index: 8,
            char: "}",
        },
    ]) {
        it(`espree error on ${JSON.stringify(code)}`, () => {
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

    for (const { code, message, lineNumber, column, index, char } of [
        {
            code: "/*empty*/",
            message: "Expected to be an expression, but got empty.",
            lineNumber: 1,
            column: 1,
            index: 0,
            char: "/",
        },
        {
            code: `
{foo}
`,
            message: "Expected token ':'.",
            lineNumber: 2,
            column: 5,
            index: 5,
            char: "}",
        },
        {
            code: `
...spread
`,
            message: "Unexpected token '...'.",
            lineNumber: 2,
            column: 1,
            index: 1,
            char: ".",
        },
        {
            code: `
{},{}
`,
            message: "Unexpected sequence expression.",
            lineNumber: 2,
            column: 1,
            index: 1,
            char: "{",
        },
        {
            code: `
{a: b}
`,
            message: "Unexpected identifier 'b'.",
            lineNumber: 2,
            column: 5,
            index: 5,
            char: "b",
        },
        {
            code: `
{...spread}
`,
            message: "Unexpected token '...'.",
            lineNumber: 2,
            column: 2,
            index: 2,
            char: ".",
        },
        {
            code: `
{["computed"]: "b"}
`,
            message: "Unexpected token '['.",
            lineNumber: 2,
            column: 2,
            index: 2,
            char: "[",
        },
        {
            code: `
{method(){}}
`,
            message: "Unexpected token '('.",
            lineNumber: 2,
            column: 8,
            index: 8,
            char: "(",
        },
        {
            code: `
{foo,bar}
`,
            message: "Expected token ':'.",
            lineNumber: 2,
            column: 5,
            index: 5,
            char: ",",
        },
        {
            code: `
{get foo(){}}
`,
            message: "Unexpected token '('.",
            lineNumber: 2,
            column: 9,
            index: 9,
            char: "(",
        },
        {
            code: `
{set foo(p){}}
`,
            message: "Unexpected token '('.",
            lineNumber: 2,
            column: 9,
            index: 9,
            char: "(",
        },
        {
            code: `
[('a')]
`,
            message: "Unexpected token '('.",
            lineNumber: 2,
            column: 2,
            index: 2,
            char: "(",
        },
        {
            code: `
['a'+'b']
`,
            message: "Unexpected binary expression.",
            lineNumber: 2,
            column: 2,
            index: 2,
            char: "'",
        },
        {
            code: `
[call()]
`,
            message: "Unexpected token '('.",
            lineNumber: 2,
            column: 6,
            index: 6,
            char: "(",
        },
        {
            code: `
foo
`,
            message: "Unexpected identifier 'foo'.",
            lineNumber: 2,
            column: 1,
            index: 1,
            char: "f",
        },
        {
            code: `
[foo]
`,
            message: "Unexpected identifier 'foo'.",
            lineNumber: 2,
            column: 2,
            index: 2,
            char: "f",
        },
        {
            code: `
42,
`,
            message: "Unexpected token ','.",
            lineNumber: 2,
            column: 3,
            index: 3,
            char: ",",
        },
        {
            code: `
typeof 123
`,
            message: "Unexpected unary expression.",
            lineNumber: 2,
            column: 1,
            index: 1,
            char: "t",
        },
        {
            code: `
+a
`,
            message: "Unexpected identifier 'a'.",
            lineNumber: 2,
            column: 2,
            index: 2,
            char: "a",
        },
        {
            code: `
+"str"
`,
            message: "Unexpected string literal.",
            lineNumber: 2,
            column: 2,
            index: 2,
            char: '"',
        },
        {
            code: `
+(+1)
`,
            message: "Unexpected token '('.",
            lineNumber: 2,
            column: 2,
            index: 2,
            char: "(",
        },
        {
            code: `
\`\${''}\`
`,
            message: "Unexpected token '${'.",
            lineNumber: 2,
            column: 2,
            index: 2,
            char: "$",
        },
        {
            code: `
\`a\${''}b\`
`,
            message: "Unexpected token '${'.",
            lineNumber: 2,
            column: 3,
            index: 3,
            char: "$",
        },
        {
            code: `
-undefined
`,
            message: "Unexpected identifier 'undefined'.",
            lineNumber: 2,
            column: 2,
            index: 2,
            char: "u",
        },
        {
            code: `
+undefined
`,
            message: "Unexpected identifier 'undefined'.",
            lineNumber: 2,
            column: 2,
            index: 2,
            char: "u",
        },
    ]) {
        it(`parseForESLint error on ${JSON.stringify(code)}`, () => {
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
