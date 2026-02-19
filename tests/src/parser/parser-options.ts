import assert from "node:assert";
import semver from "semver";

import * as jsoncParser from "../../../src/index.ts";
import { Linter } from "eslint";
import espreePkg from "espree/package.json" with { type: "json" };

describe("Parser options.", () => {
  for (const { code, parserOptions, errors } of [
    ...(semver.satisfies(espreePkg.version, ">=7.2.0")
      ? [
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
        ]
      : []),
  ]) {
    it(`${JSON.stringify(code)} with parserOptions: ${JSON.stringify(
      parserOptions,
    )}`, () => {
      const linter = new Linter();

      const result = linter.verify(
        code,
        {
          files: ["*.json"],
          languageOptions: {
            parser: jsoncParser,
            parserOptions: parserOptions as never,
          },
        },
        "test.json",
      );
      assert.deepStrictEqual(result, errors);
    });
  }
});
