import assert from "assert";
import { jsoncParser } from "../../src";
import { version } from "../../package.json";
const expectedMeta = {
  name: "jsonc-eslint-parser",
  version,
};

describe("Test for meta object", () => {
  it("The parser should have a meta object.", () => {
    assert.deepStrictEqual(jsoncParser.meta, expectedMeta);
  });
});
