# AST for JSONC

See details: [../src/parser/ast.ts](../src/parser/ast.ts)

## Node

```ts
interface BaseJSONNode {
    type: string;
    loc: SourceLocation;
    range: [number, number];
}
```

All nodes have `type`, `range`, `loc` and `parent` properties according to [ESLint - The AST specification].

## Identifiers

### JSONIdentifier

```ts
export interface JSONIdentifier extends BaseJSONNode {
    type: "JSONIdentifier"
    name: string
    parent:
        | JSONArrayExpression
        | JSONProperty
        | JSONExpressionStatement
        | JSONUnaryExpression
}
```

This node is [Identifier](https://github.com/estree/estree/blob/master/es5.md#identifier) for JSON.

## Literals

### JSONLiteral

```ts
export interface JSONLiteralBase extends BaseJSONNode {
    type: "JSONLiteral"
    value: string | number | boolean | null
    regex: 
        | {
            pattern: string
            flags: string
        }
        | null
    bigint: string | null
    raw: string
    parent:
        | JSONArrayExpression
        | JSONProperty
        | JSONExpressionStatement
        | JSONUnaryExpression
        | JSONBinaryExpression
}
```

This node is [Literal](https://github.com/estree/estree/blob/master/es5.md#literal) for JSON.

### JSONTemplateLiteral

```ts
export interface JSONTemplateLiteral extends BaseJSONNode {
    type: "JSONTemplateLiteral"
    quasis: [JSONTemplateElement]
    expressions: []
    parent: JSONArrayExpression | JSONProperty | JSONExpressionStatement
}
```

This node is [TemplateLiteral](https://github.com/estree/estree/blob/master/es2015.md#templateliteral) for JSON.
This parser can only parse static values. You cannot use template literals in actual JSON, JSONC and JSON5.

### JSONTemplateElement

```ts

export interface JSONTemplateElement extends BaseJSONNode {
    type: "JSONTemplateElement"
    tail: boolean
    value: {
        cooked: string
        raw: string
    }
    parent: JSONTemplateLiteral
}
```

This node is [TemplateElement](https://github.com/estree/estree/blob/master/es2015.md#templateelement) for JSON.

## Expressions

### JSONExpression

```ts
export type JSONExpression =
    | JSONArrayExpression
    | JSONObjectExpression
    | JSONLiteral
    | JSONUnaryExpression
    | ( JSONIdentifier & { name: "Infinity" | "NaN" | "undefined" } )
    | JSONTemplateLiteral
    | JSONBinaryExpression
```

This parser can parse `"Infinity"`, `"NaN"` and `"undefined"` as values. But you can't use these values in actual JSON, JSONC and JSON5.

### JSONObjectExpression

```ts
export interface JSONObjectExpression extends BaseJSONNode {
    type: "JSONObjectExpression"
    properties: JSONProperty[]
    parent: JSONArrayExpression | JSONProperty | JSONExpressionStatement
}
```

This node is [ObjectExpression](https://github.com/estree/estree/blob/master/es5.md#objectexpression) for JSON.

### JSONProperty

```ts
export interface JSONProperty extends BaseJSONNode {
    type: "JSONProperty"
    key: JSONIdentifier | ( JSONLiteral & { value: string | number } )
    value: JSONExpression
    kind: "init"
    method: false
    shorthand: false
    computed: false
    parent: JSONObjectExpression
}
```

This node is [Property](https://github.com/estree/estree/blob/master/es5.md#property) for JSON.

### JSONArrayExpression

```ts
export interface JSONArrayExpression extends BaseJSONNode {
    type: "JSONArrayExpression"
    elements: (JSONExpression | null)[]
    parent: JSONArrayExpression | JSONProperty | JSONExpressionStatement
}
```

This node is [ArrayExpression](https://github.com/estree/estree/blob/master/es5.md#arrayexpression) for JSON.

### JSONUnaryExpression

```ts
export interface JSONUnaryExpression extends BaseJSONNode {
    type: "JSONUnaryExpression"
    operator: "-" | "+"
    prefix: true
    argument: ( JSONLiteral & { value: number } ) | ( JSONIdentifier & { name: "Infinity" | "NaN" } )
    parent: JSONArrayExpression | JSONProperty | JSONExpressionStatement
}
```

This node is [UnaryExpression](https://github.com/estree/estree/blob/master/es5.md#unaryexpression) for JSON.

Only `"-"` can be used by `operator` in JSON and JSONC.

### JSONBinaryExpression

```ts
export interface JSONUnaryExpression extends BaseJSONNode {
    type: "JSONBinaryExpression"
    operator: "-" | "+" | "*" | "/" | "%" | "**"
    left: JSONNumberLiteral | JSONUnaryExpression | JSONBinaryExpression
    right: JSONNumberLiteral | JSONUnaryExpression | JSONBinaryExpression
    parent:
        | JSONArrayExpression
        | JSONProperty
        | JSONExpressionStatement
        | JSONUnaryExpression
        | JSONBinaryExpression
}
```

This node is [BinaryExpression](https://github.com/estree/estree/blob/master/es5.md#binaryexpression) for JSON.

This parser can only parse binary expressions of static numbers. You cannot use binary expressions in actual JSON, JSONC and JSON5.

## Statements

### JSONExpressionStatement

```ts
export interface JSONExpressionStatement extends BaseJSONNode {
    type: "JSONExpressionStatement"
    expression: JSONExpression
    parent: JSONProgram
}
```

This node is [ExpressionStatement](https://github.com/estree/estree/blob/master/es5.md#expressionstatement) for JSON.
There is always one `JSONExpressionStatement` in one JSON.

## Root

### Program

```ts
extend interface JSONProgram extends BaseJSONNode {
    type: "Program"
    body: [JSONExpressionStatement]
}
```

The `body` of the `Program` node generated by this parser is an array of one `JSONExpressionStatement`.

[ESLint - The AST specification]: https://eslint.org/docs/developer-guide/working-with-custom-parsers#the-ast-specification
