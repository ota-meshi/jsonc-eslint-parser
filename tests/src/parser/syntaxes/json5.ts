import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getStaticJSONValue, parseJSON } from "../../../../src/index.ts";
import { parseForESLint } from "../../../../src/parser/parser.ts";
import type { ParseError } from "../../../../src/parser/errors.ts";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = path.resolve(
  dirname,
  "../../../fixtures/parser/json5-tests",
);

type ExpectedJSONValue =
  | ["null"]
  | ["boolean", boolean]
  | ["string", string]
  | ["number", string]
  | ["array", ExpectedJSONValue[]]
  | ["object", [string, ExpectedJSONValue][]];

const EXPECTED_VALUES = JSON.parse(
  fs.readFileSync(path.join(FIXTURE_ROOT, "expected.json"), "utf8"),
) as Record<string, ExpectedJSONValue>;

function getExpectedValue(value: ExpectedJSONValue): unknown {
  switch (value[0]) {
    case "null":
      return null;
    case "boolean":
    case "string":
      return value[1];
    case "number":
      switch (value[1]) {
        case "NaN":
          return Number.NaN;
        case "+Infinity":
          return Number.POSITIVE_INFINITY;
        case "-Infinity":
          return Number.NEGATIVE_INFINITY;
        case "-0":
          return -0;
        default:
          return Buffer.from(value[1], "hex").readDoubleBE(0);
      }
    case "array":
      return value[1].map(getExpectedValue);
    case "object":
      return Object.fromEntries(
        value[1].map(([key, entry]) => [key, getExpectedValue(entry)]),
      );
    default:
      return assert.fail(`Unexpected expected value type: ${value[0]}`);
  }
}

function getFixtureFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fileName = path.join(directory, entry.name);
    return entry.isDirectory() ? getFixtureFiles(fileName) : [fileName];
  });
}

function getParseError(code: string): ParseError {
  try {
    parseForESLint(code, {
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

describe("JSON5 test vectors", () => {
  for (const fileName of getFixtureFiles(FIXTURE_ROOT)
    .filter(
      (f) =>
        [".json", ".json5", ".js", ".txt"].includes(path.extname(f)) &&
        path.relative(FIXTURE_ROOT, f) !== "expected.json",
    )
    .sort()) {
    const id = path.relative(FIXTURE_ROOT, fileName).split(path.sep).join("/");

    if (id === "todo/unicode-escaped-unquoted-key.json5") {
      // JSON5 mode disables identifier escapes (see src/parser/syntax-context.ts).
      it.skip(`JSON5: ${id}`);
      continue;
    }

    it(`JSON5: ${id}`, () => {
      const code = fs.readFileSync(fileName, "utf8");
      if ([".json", ".json5"].includes(path.extname(fileName))) {
        const ast = parseJSON(code, { jsonSyntax: "JSON5" });
        const expected = EXPECTED_VALUES[id];
        assert.ok(expected, `Missing expected value for ${id}`);
        assert.deepStrictEqual(
          getStaticJSONValue(ast),
          getExpectedValue(expected),
        );
      } else {
        assert.throws(() => parseJSON(code, { jsonSyntax: "JSON5" }));
      }
    });
  }
});
