import assert from "assert";

import { parseForESLint } from "../../../../src/parser/parser";
import type { ParseError } from "../../../../src/parser/errors";

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
      jsonSyntax: "json5",
    });
  } catch (e: any) {
    return e;
  }
  return assert.fail("Expected parsing error, but nor error");
}

describe("Check that parsing error is correct for JSON5.", () => {
  for (const { code, message, lineNumber, column, index, char } of [
    {
      code: "{1:2}",
      message: "Unexpected number literal.",
      lineNumber: 1,
      column: 2,
      index: 1,
      char: "1",
    },
    {
      code: "undefined",
      message: "Unexpected identifier 'undefined'.",
      lineNumber: 1,
      column: 1,
      index: 0,
      char: "u",
    },
    {
      code: "[1,,3]",
      message: "Unexpected token ','.",
      lineNumber: 1,
      column: 3,
      index: 2,
      char: ",",
    },
    {
      code: "[,2,3]",
      message: "Unexpected token ','.",
      lineNumber: 1,
      column: 2,
      index: 1,
      char: ",",
    },
    {
      code: "[1,,]",
      message: "Unexpected token ','.",
      lineNumber: 1,
      column: 3,
      index: 2,
      char: ",",
    },
    {
      code: "/reg/",
      message: "Unexpected regex literal.",
      lineNumber: 1,
      column: 1,
      index: 0,
      char: "/",
    },
    {
      code: "`tmp`",
      message: "Unexpected template literal.",
      lineNumber: 1,
      column: 1,
      index: 0,
      char: "`",
    },
    {
      code: "1n",
      message: "Unexpected bigint literal.",
      lineNumber: 1,
      column: 1,
      index: 0,
      char: "1",
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
      message: "Unexpected escape sequence.",
      lineNumber: 1,
      column: 2,
      index: 1,
      char: "a",
    },
    {
      code: '{a\\u0031:"foo"}',
      message: "Unexpected escape sequence.",
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
    {
      code: "012",
      message: "Unexpected legacy octal numeric literal.",
      lineNumber: 1,
      column: 1,
      index: 0,
      char: "0",
    },
    {
      code: "09",
      message: "Unexpected legacy octal numeric literal.",
      lineNumber: 1,
      column: 1,
      index: 0,
      char: "0",
    },
    {
      code: "(42)",
      message: "Unexpected token '('.",
      lineNumber: 1,
      column: 1,
      index: 0,
      char: "(",
    },
    {
      code: "[('a')]",
      message: "Unexpected token '('.",
      lineNumber: 1,
      column: 2,
      index: 1,
      char: "(",
    },
    {
      code: "42+1",
      message: "Unexpected binary expression.",
      lineNumber: 1,
      column: 1,
      index: 0,
      char: "4",
    },
  ]) {
    it(`JSON5 parseForESLint error on ${JSON.stringify(code)}`, () => {
      const e = getParseError(code);
      assert.deepStrictEqual(
        {
          message: e.message,
          lineNumber: e.lineNumber,
          column: e.column,
          index: e.index,
          char: code[e.index],
        },
        { message, lineNumber, column, index, char },
      );
    });
  }
});
