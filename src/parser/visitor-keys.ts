import type { SourceCode } from "eslint"
import Evk from "eslint-visitor-keys"
import type { JSONNode } from "./ast"

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
}

export const KEYS: SourceCode.VisitorKeys = Evk.unionWith(
    jsonKeys,
) as SourceCode.VisitorKeys
