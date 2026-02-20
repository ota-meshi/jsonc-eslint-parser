export type JSONSyntaxContext = {
  trailingCommas: boolean;
  comments: boolean;
  // invalid JSON numbers
  plusSigns: boolean;
  spacedSigns: boolean;
  leadingOrTrailingDecimalPoints: boolean;
  infinities: boolean;
  nans: boolean;
  numericSeparators: boolean;
  binaryNumericLiterals: boolean;
  octalNumericLiterals: boolean;
  legacyOctalNumericLiterals: boolean;
  invalidJsonNumbers: boolean;
  // statics
  multilineStrings: boolean;
  unquoteProperties: boolean;
  singleQuotes: boolean;
  numberProperties: boolean;
  undefinedKeywords: boolean;
  sparseArrays: boolean;
  regExpLiterals: boolean;
  templateLiterals: boolean;
  bigintLiterals: boolean;
  unicodeCodepointEscapes: boolean;
  escapeSequenceInIdentifier: boolean;
  // JS-likes
  parentheses: boolean;
  staticExpressions: boolean;
};

/**
 * Normalize json syntax option
 */
export function getJSONSyntaxContext(str?: string | null): JSONSyntaxContext {
  const upperCase = str?.toUpperCase();
  if (upperCase === "JSON") {
    return {
      trailingCommas: false,
      comments: false,
      plusSigns: false,
      spacedSigns: false,
      leadingOrTrailingDecimalPoints: false,
      infinities: false,
      nans: false,
      numericSeparators: false,
      binaryNumericLiterals: false,
      octalNumericLiterals: false,
      legacyOctalNumericLiterals: false,
      invalidJsonNumbers: false,
      multilineStrings: false,
      unquoteProperties: false,
      singleQuotes: false,
      numberProperties: false,
      undefinedKeywords: false,
      sparseArrays: false,
      regExpLiterals: false,
      templateLiterals: false,
      bigintLiterals: false,
      unicodeCodepointEscapes: false,
      escapeSequenceInIdentifier: false,
      parentheses: false,
      staticExpressions: false,
    };
  }
  if (upperCase === "JSONC") {
    return {
      trailingCommas: true,
      comments: true,
      plusSigns: false,
      spacedSigns: false,
      leadingOrTrailingDecimalPoints: false,
      infinities: false,
      nans: false,
      numericSeparators: false,
      binaryNumericLiterals: false,
      octalNumericLiterals: false,
      legacyOctalNumericLiterals: false,
      invalidJsonNumbers: false,
      multilineStrings: false,
      unquoteProperties: false,
      singleQuotes: false,
      numberProperties: false,
      undefinedKeywords: false,
      sparseArrays: false,
      regExpLiterals: false,
      templateLiterals: false,
      bigintLiterals: false,
      unicodeCodepointEscapes: false,
      escapeSequenceInIdentifier: false,
      parentheses: false,
      staticExpressions: false,
    };
  }
  if (upperCase === "JSON5") {
    return {
      trailingCommas: true,
      comments: true,
      plusSigns: true,
      spacedSigns: true,
      leadingOrTrailingDecimalPoints: true,
      infinities: true,
      nans: true,
      numericSeparators: false,
      binaryNumericLiterals: false,
      octalNumericLiterals: false,
      legacyOctalNumericLiterals: false,
      invalidJsonNumbers: true,
      multilineStrings: true,
      unquoteProperties: true,
      singleQuotes: true,
      numberProperties: false,
      undefinedKeywords: false,
      sparseArrays: false,
      regExpLiterals: false,
      templateLiterals: false,
      bigintLiterals: false,
      unicodeCodepointEscapes: false,
      escapeSequenceInIdentifier: false,
      parentheses: false,
      staticExpressions: false,
    };
  }
  return {
    trailingCommas: true,
    comments: true,
    plusSigns: true,
    spacedSigns: true,
    leadingOrTrailingDecimalPoints: true,
    infinities: true,
    nans: true,
    numericSeparators: true,
    binaryNumericLiterals: true,
    octalNumericLiterals: true,
    legacyOctalNumericLiterals: true,
    invalidJsonNumbers: true,
    multilineStrings: true,
    unquoteProperties: true,
    singleQuotes: true,
    numberProperties: true,
    undefinedKeywords: true,
    sparseArrays: true,
    regExpLiterals: true,
    templateLiterals: true,
    bigintLiterals: true,
    unicodeCodepointEscapes: true,
    escapeSequenceInIdentifier: true,
    parentheses: true,
    staticExpressions: true,
  };
}
