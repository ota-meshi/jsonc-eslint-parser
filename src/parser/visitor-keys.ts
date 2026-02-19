import type { SourceCode } from "eslint";
import * as Evk from "eslint-visitor-keys";
import evkPkg from "eslint-visitor-keys/package.json" with { type: "json" };
import type { JSONNode } from "./ast.ts";
import {
  loadNewest,
  requireFromCwd,
  requireFromLinter,
} from "./modules/require-utils.ts";

const jsonKeys: { [key in JSONNode["type"]]: string[] } = {
  Program: ["body"],
  JSONExpressionStatement: ["expression"],
  JSONArrayExpression: ["elements"],
  JSONObjectExpression: ["properties"],
  JSONProperty: ["key", "value"],
  JSONIdentifier: [],
  JSONLiteral: [],
  JSONUnaryExpression: ["argument"],
  JSONTemplateLiteral: ["quasis", "expressions"],
  JSONTemplateElement: [],
  JSONBinaryExpression: ["left", "right"],
};

let cache: SourceCode.VisitorKeys | null = null;
/**
 * Get visitor keys
 */
export function getVisitorKeys(): SourceCode.VisitorKeys {
  if (!cache) {
    const vk: typeof Evk = loadNewest([
      {
        getPkg() {
          return requireFromCwd("eslint-visitor-keys/package.json");
        },
        get() {
          return requireFromCwd("eslint-visitor-keys");
        },
      },
      {
        getPkg() {
          return requireFromLinter("eslint-visitor-keys/package.json");
        },
        get() {
          return requireFromLinter("eslint-visitor-keys");
        },
      },
      {
        getPkg() {
          return evkPkg;
        },
        get() {
          return Evk;
        },
      },
    ]);

    cache = vk.unionWith(jsonKeys) as SourceCode.VisitorKeys;
  }
  return cache;
}
