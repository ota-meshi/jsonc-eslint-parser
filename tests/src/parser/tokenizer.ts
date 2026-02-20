import assert from "node:assert";
import { tokenize } from "../../../src/index.ts";
import type { AST } from "eslint";
import type { Comment } from "estree";

describe("tokenize", () => {
  describe("Basic tokenization", () => {
    it("should return an array of tokens", () => {
      const code = '"hello"';
      const tokens = tokenize(code, { jsonSyntax: "JSON" });

      assert(Array.isArray(tokens));
      assert(tokens.length > 0);
    });

    it("should tokenize numbers", () => {
      const code = "123";
      const tokens = tokenize(code, { jsonSyntax: "JSON" });

      assert(Array.isArray(tokens));
      const numericTokens = tokens.filter((t) => t.type === "Numeric");
      assert(numericTokens.length > 0);
    });

    it("should tokenize booleans", () => {
      const code = "true";
      const tokens = tokenize(code, { jsonSyntax: "JSON" });

      assert(Array.isArray(tokens));
      const boolTokens = tokens.filter((t) => t.type === "Boolean");
      assert(boolTokens.length > 0);
    });

    it("should tokenize null", () => {
      const code = "null";
      const tokens = tokenize(code, { jsonSyntax: "JSON" });

      assert(Array.isArray(tokens));
      const nullTokens = tokens.filter((t) => t.type === "Null");
      assert(nullTokens.length > 0);
    });
  });

  describe("Token properties", () => {
    it("should have range property", () => {
      const code = '"test"';
      const tokens = tokenize(code, { jsonSyntax: "JSON" });

      for (const token of tokens) {
        assert(Array.isArray(token.range));
        assert.strictEqual(token.range.length, 2);
        assert(typeof token.range[0] === "number");
        assert(typeof token.range[1] === "number");
      }
    });

    it("should have loc property", () => {
      const code = '"test"';
      const tokens = tokenize(code, { jsonSyntax: "JSON" });

      for (const token of tokens) {
        assert(token.loc);
        assert(token.loc.start);
        assert(token.loc.end);
        assert(typeof token.loc.start.line === "number");
        assert(typeof token.loc.start.column === "number");
        assert(typeof token.loc.end.line === "number");
        assert(typeof token.loc.end.column === "number");
      }
    });

    it("should have value and type properties", () => {
      const code = '"test"';
      const tokens = tokenize(code, { jsonSyntax: "JSON" });

      for (const token of tokens) {
        assert(typeof token.type === "string");
        assert(token.value !== undefined);
      }
    });
  });

  describe("Comments handling", () => {
    it("should not include comments by default", () => {
      const code = `// comment
42`;
      const tokens = tokenize(code, { jsonSyntax: "JSONC" });

      assert(Array.isArray(tokens));
      // All items should be tokens
      const comments = tokens.filter(
        (t: AST.Token | Comment) =>
          "type" in t && (t.type === "Line" || t.type === "Block"),
      );
      assert.strictEqual(comments.filter((t) => "type" in t).length, 0);
    });

    it("should include comments when includeComments is true", () => {
      const code = `// comment
42`;
      const items = tokenize(code, {
        jsonSyntax: "JSONC",
        includeComments: true,
      });

      assert(Array.isArray(items));
      // At least one should be a comment
      const comments = items.filter(
        (item): item is Comment => "type" in item && item.type === "Line",
      );
      assert(comments.length > 0);
    });
  });

  describe("JSON syntax variants", () => {
    it("should handle JSON syntax", () => {
      const code = "42";
      const tokens = tokenize(code, { jsonSyntax: "JSON" });

      assert(Array.isArray(tokens));
      assert(tokens.length > 0);
    });

    it("should handle JSONC syntax", () => {
      const code = `// comment
42`;
      const tokens = tokenize(code, { jsonSyntax: "JSONC" });

      assert(Array.isArray(tokens));
      assert(tokens.length > 0);
    });

    it("should handle JSON5 syntax", () => {
      const code = "{ trailing: 'value', }";
      const tokens = tokenize(code, { jsonSyntax: "JSON5" });

      assert(Array.isArray(tokens));
      assert(tokens.length > 0);
    });
  });

  describe("Unicode and special characters", () => {
    it("should handle Unicode in strings", () => {
      const code = '"🎉"';
      const tokens = tokenize(code, { jsonSyntax: "JSON" });

      assert(Array.isArray(tokens));
      assert(tokens.length > 0);
    });

    it("should handle escaped characters", () => {
      const code = '"line1\\nline2"';
      const tokens = tokenize(code, { jsonSyntax: "JSON" });

      assert(Array.isArray(tokens));
      const stringTokens = tokens.filter((t) => t.type === "String");
      assert(stringTokens.length > 0);
    });

    it("should handle escaped quotes", () => {
      const code = '"say \\"hello\\""';
      const tokens = tokenize(code, { jsonSyntax: "JSON" });

      assert(Array.isArray(tokens));
      const stringTokens = tokens.filter((t) => t.type === "String");
      assert(stringTokens.length > 0);
    });
  });

  describe("Numeric variations", () => {
    it("should handle floating point numbers", () => {
      const code = "3.14";
      const tokens = tokenize(code, { jsonSyntax: "JSON" });

      const numTokens = tokens.filter((t) => t.type === "Numeric");
      assert(numTokens.length > 0);
    });

    it("should handle scientific notation", () => {
      const code = "1e-5";
      const tokens = tokenize(code, { jsonSyntax: "JSON" });

      const numTokens = tokens.filter((t) => t.type === "Numeric");
      assert(numTokens.length > 0);
    });

    it("should handle negative numbers", () => {
      const code = "-42";
      const tokens = tokenize(code, { jsonSyntax: "JSON" });

      assert(Array.isArray(tokens));
      assert(tokens.length > 0);
    });
  });

  describe("Token ordering", () => {
    it("should maintain token order by position", () => {
      const code = "[1, 2, 3]";
      const tokens = tokenize(code, { jsonSyntax: "JSON" });

      let previousEnd = 0;
      for (const token of tokens) {
        assert(
          token.range[0] >= previousEnd,
          "Tokens should be in order by position",
        );
        previousEnd = token.range[1];
      }
    });

    it("should correctly span the entire input when combined", () => {
      const code = '{"key": "value"}';
      const tokens = tokenize(code, { jsonSyntax: "JSON" });

      // First token should start at 0
      if (tokens.length > 0) {
        const firstToken = tokens[0];
        const lastToken = tokens[tokens.length - 1];

        // Tokens should span the input
        assert(firstToken.range[0] <= 0);
        assert(lastToken.range[1] >= code.length);
      }
    });
  });
});
