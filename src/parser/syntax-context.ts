export type JSONSyntaxContext = {
    trailingCommas: boolean
    comments: boolean
    // invalid JSON numbers
    plusSigns: boolean
    spacedSigns: boolean
    leadingOrTrailingDecimalPoints: boolean
    infinities: boolean
    nans: boolean
    numericSeparators: boolean
    binaryNumericLiterals: boolean
    octalNumericLiterals: boolean
    legacyOctalNumericLiterals: boolean
    invalidJsonNumbers: boolean
    // statics
    multilineStrings: boolean
    unquoteProperties: boolean
    singleQuotes: boolean
    numberProperties: boolean
    undefinedKeywords: boolean
    sparseArrays: boolean
    regExpLiterals: boolean
    templateLiterals: boolean
    bigintLiterals: boolean
    unicodeCodepointEscapes: boolean
    escapeSequenceInIdentifier: boolean
    // JS-likes
    parentheses: boolean
    // staticExpression: boolean
}
